import { Invoice, InvoiceStatus } from '../models/Invoice';
import { Agreement } from '../models/Agreement';
import { Event } from '../models/Event';
import { Registration } from '../models/Registration';
import { EmailQueue } from '../models/EmailQueue';
import { emailNotificationManager } from './EmailNotificationManager';
import { EventStatus, RegistrationStatus } from '../types';
import { logger } from '../utils/logger';

class EmailCronScheduler {
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;

  public start(intervalMinutes = 15) {
    if (this.timer) return;
    const intervalMs = intervalMinutes * 60 * 1000;
    logger.info(`⏰ Email Automated Reminders Scheduler started (interval: ${intervalMinutes}m)`);
    this.timer = setInterval(() => this.runScheduledChecks(), intervalMs);
    // Initial run delayed by 10s to allow server initialization
    setTimeout(() => this.runScheduledChecks(), 10000);
  }

  public stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      logger.info('🛑 Email Automated Reminders Scheduler stopped');
    }
  }

  public async runScheduledChecks() {
    if (this.isRunning) return;
    this.isRunning = true;
    logger.info('⏰ Running automated email reminder checks...');

    try {
      await Promise.all([
        this.checkPaymentReminders(),
        this.checkWorkspaceRenewals(),
        this.checkExpiredAgreements(),
        this.checkEventReminders(),
      ]);
    } catch (error) {
      logger.error('❌ Error during scheduled email reminder check:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * 1. Automatic Payment Reminders: 14d, 7d, 3d, 1d before due, due today, 3d, 7d, 30d overdue
   */
  private async checkPaymentReminders() {
    try {
      const unpaidInvoices = await Invoice.find({
        status: InvoiceStatus.UNPAID,
        dueDate: { $exists: true, $ne: null },
      }).lean();

      const now = new Date();
      now.setHours(0, 0, 0, 0);

      for (const inv of unpaidInvoices) {
        if (!inv.dueDate || !inv.userEmail) continue;

        const due = new Date(inv.dueDate);
        due.setHours(0, 0, 0, 0);
        const diffDays = Math.round((due.getTime() - now.getTime()) / (1000 * 3600 * 24));

        let stageKey = '';
        if (diffDays === 14) stageKey = '14_days_before';
        else if (diffDays === 7) stageKey = '7_days_before';
        else if (diffDays === 3) stageKey = '3_days_before';
        else if (diffDays === 1) stageKey = '1_day_before';
        else if (diffDays === 0) stageKey = 'due_today';
        else if (diffDays === -3) stageKey = '3_days_overdue';
        else if (diffDays === -7) stageKey = '7_days_overdue';
        else if (diffDays === -30) stageKey = '30_days_overdue';

        if (!stageKey) continue;

        // Ensure we haven't already queued a reminder for this invoice and stage
        const alreadySent = await (EmailQueue as any).findOne({
          templateKey: 'payment_reminder',
          'metadata.invoiceNumber': inv.invoiceNumber,
          'metadata.reminderStage': stageKey,
        });

        if (!alreadySent) {
          logger.info(`⏰ Queueing payment reminder (${stageKey}) for Invoice #${inv.invoiceNumber} -> ${inv.userEmail}`);
          await emailNotificationManager.sendPaymentReminder(
            inv,
            { name: inv.billingDetails?.name || 'Client', email: inv.userEmail },
            stageKey
          );
        }
      }
    } catch (err) {
      logger.error('❌ Error checking payment reminders:', err);
    }
  }

  /**
   * 2. Workspace Renewal Reminders: 30d, 14d, 7d, 3d, 1d before expiry
   */
  private async checkWorkspaceRenewals() {
    try {
      const activeAgreements = await Agreement.find({
        status: 'ACTIVE',
        endDate: { $exists: true, $ne: null },
      }).lean();

      const now = new Date();
      now.setHours(0, 0, 0, 0);

      for (const ag of activeAgreements) {
        if (!ag.endDate || !ag.userEmail) continue;

        const end = new Date(ag.endDate);
        end.setHours(0, 0, 0, 0);
        const diffDays = Math.round((end.getTime() - now.getTime()) / (1000 * 3600 * 24));

        if ([30, 14, 7, 3, 1].includes(diffDays)) {
          const stageKey = `${diffDays}_days_before`;
          const alreadySent = await (EmailQueue as any).findOne({
            templateKey: 'workspace_renewal',
            'metadata.agreementNumber': ag.agreementNumber,
            'metadata.renewalStage': stageKey,
          });

          if (!alreadySent) {
            logger.info(`⏰ Queueing renewal notice (${diffDays} days left) for Agreement #${ag.agreementNumber} -> ${ag.userEmail}`);
            await emailNotificationManager.sendWorkspaceRenewalReminder(
              ag,
              { name: ag.customerSignature?.name || 'Member', email: ag.userEmail },
              ag.workspaceName || 'Workspace',
              diffDays
            );
          }
        }
      }
    } catch (err) {
      logger.error('❌ Error checking workspace renewals:', err);
    }
  }

  /**
   * 3. Agreement Expired Notice
   */
  private async checkExpiredAgreements() {
    try {
      const now = new Date();
      const expiredAgreements = await Agreement.find({
        status: 'ACTIVE',
        endDate: { $lt: now },
      });

      for (const ag of expiredAgreements) {
        ag.status = 'EXPIRED';
        await ag.save();

        if (ag.userEmail) {
          logger.info(`⏰ Marking Agreement #${ag.agreementNumber} EXPIRED & notifying ${ag.userEmail}`);
          await emailNotificationManager.sendAgreementExpired(
            ag,
            { name: ag.customerSignature?.name || 'Member', email: ag.userEmail },
            ag.workspaceName || 'Workspace'
          );
        }
      }
    } catch (err) {
      logger.error('❌ Error checking expired agreements:', err);
    }
  }

  /**
   * 4. Event Reminders: 24 Hours & 2 Hours before event start
   */
  private async checkEventReminders() {
    try {
      const now = new Date();
      const next24h = new Date(now.getTime() + 25 * 3600 * 1000);

      const upcomingEvents = await (Event as any).find({
        status: { $in: [EventStatus.PUBLISHED] },
        'schedule.startDate': { $gte: now, $lte: next24h },
      }).lean();

      for (const ev of upcomingEvents) {
        if (!ev.schedule?.startDate) continue;
        const start = new Date(ev.schedule.startDate);
        const hoursDiff = (start.getTime() - now.getTime()) / (1000 * 3600);

        let stageHours = 0;
        if (hoursDiff >= 23 && hoursDiff <= 25) stageHours = 24;
        else if (hoursDiff >= 1.5 && hoursDiff <= 2.5) stageHours = 2;

        if (!stageHours) continue;

        // Find all confirmed registrations for this event
        const registrations = await (Registration as any).find({
          eventId: ev._id ? ev._id.toString() : ev.id,
          status: RegistrationStatus.CONFIRMED,
        }).lean();

        for (const reg of registrations) {
          if (!reg.userEmail) continue;

          const alreadySent = await (EmailQueue as any).findOne({
            templateKey: 'event_reminder',
            'metadata.eventId': ev._id ? ev._id.toString() : ev.id,
            'metadata.registrationId': reg._id ? reg._id.toString() : reg.id,
            'metadata.hoursBefore': stageHours,
          });

          if (!alreadySent) {
            logger.info(`⏰ Queueing Event Reminder (${stageHours}h before) for ${ev.title} -> ${reg.userEmail}`);
            await emailNotificationManager.sendEventReminder(
              reg,
              ev,
              { name: (reg as any).attendeeName || 'Attendee', email: reg.userEmail },
              stageHours
            );
          }
        }
      }
    } catch (err) {
      logger.error('❌ Error checking event reminders:', err);
    }
  }
}

export const emailCronScheduler = new EmailCronScheduler();
