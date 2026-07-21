import { Booking } from '../../models/Booking';
import { Invoice, InvoiceStatus } from '../../models/Invoice';
import { Workspace } from '../../models/Workspace';
import { Payment } from '../../models/Payment';
import { emailService } from '../EmailService';
import { notificationService, NotificationCategory } from '../NotificationService';
import { logger } from '../../utils/logger';

export class BillingSchedulerService {
  private interval: NodeJS.Timeout | null = null;

  /**
   * Start the billing scheduler interval
   */
  public startScheduler() {
    if (this.interval) return;

    logger.info('⏰ Booting WeVentureHub Billing Scheduler Engine...');

    // Run checks every hour
    this.interval = setInterval(async () => {
      try {
        await this.generateRecurringInvoices();
        await this.checkOverdueInvoices();
        await this.checkAgreementRenewals();
      } catch (err) {
        logger.error('❌ Error during billing scheduler execution:', err);
      }
    }, 60 * 60 * 1000); // Once per hour

    // Run once immediately on boot
    setTimeout(async () => {
      try {
        await this.generateRecurringInvoices();
        await this.checkOverdueInvoices();
        await this.checkAgreementRenewals();
      } catch (err) {
        logger.error('❌ Error during initial billing scheduler execution:', err);
      }
    }, 5000);
  }

  /**
   * Stop the billing scheduler
   */
  public stopScheduler() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      logger.info('⏰ WeVentureHub Billing Scheduler Engine stopped.');
    }
  }

  /**
   * 1. Recurring Invoice Automation
   */
  public async generateRecurringInvoices() {
    logger.info('⏰ Running Recurring Invoice Automation check...');
    try {
      const now = new Date();

      // Find all confirmed bookings with a recurring billing plan
      const recurringBookings = await Booking.find({
        status: 'CONFIRMED',
        billingPlanName: { $in: ['Weekly', 'Monthly', 'Quarterly', 'Yearly'] },
        endTime: { $gt: now },
      }).exec();

      for (const booking of recurringBookings) {
        const workspace = await Workspace.findById(booking.spaceId).exec();
        if (!workspace) continue;

        // Fetch all invoices for this booking sorted by creation date (descending)
        const invoices = await Invoice.find({ bookingId: booking.id }).sort({ createdAt: -1 }).exec();

        let needNewInvoice = false;
        let cycleNumber = 1;

        if (invoices.length === 0) {
          // No invoice exists yet; generate the first one immediately
          needNewInvoice = true;
          cycleNumber = 1;
        } else {
          const latestInvoice = invoices[0];
          cycleNumber = invoices.length + 1;

          // Determine the cycle period duration in milliseconds
          let periodMs = 30 * 24 * 60 * 60 * 1000; // Monthly default (30 days)
          if (booking.billingPlanName === 'Weekly') {
            periodMs = 7 * 24 * 60 * 60 * 1000;
          } else if (booking.billingPlanName === 'Quarterly') {
            periodMs = 90 * 24 * 60 * 60 * 1000;
          } else if (booking.billingPlanName === 'Yearly') {
            periodMs = 365 * 24 * 60 * 60 * 1000;
          }

          const msSinceLatestInvoice = now.getTime() - latestInvoice.createdAt.getTime();

          if (msSinceLatestInvoice >= periodMs) {
            needNewInvoice = true;
          }
        }

        if (needNewInvoice) {
          logger.info(`📝 Generating recurring invoice for booking ${booking.id}, customer ${booking.userEmail}, Cycle #${cycleNumber}`);

          const invoiceNumber = `INV-REC-${new Date().toISOString().substring(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 9000 + 1000)}`;
          
          // Compute due date (e.g. 5 days from now)
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + 5);

          // Get the selected billing plan's price
          const activePlan = workspace.billingPlans?.find(
            (p) => p.name === booking.billingPlanName && p.isActive
          );
          const price = activePlan ? activePlan.price : booking.totalAmount;
          const currency = activePlan ? activePlan.currency : 'ETB';

          const billingDetails = booking.billingDetails || {
            name: booking.userEmail.split('@')[0],
            email: booking.userEmail,
          };

          const invoice = await Invoice.create({
            tenantId: booking.tenantId,
            userId: booking.userId,
            userEmail: booking.userEmail,
            invoiceNumber,
            bookingId: booking.id,
            amount: price,
            currency,
            status: InvoiceStatus.UNPAID,
            dueDate,
            billingDetails,
            lineItems: [
              {
                description: `Recurring Coworking Space Charge - ${workspace.name} (${booking.billingPlanName} Cycle #${cycleNumber})`,
                quantity: 1,
                unitPrice: price,
                amount: price,
              },
            ],
          });

          // Send Email with Invoice details and payment instructions
          const emailHtml = `
            <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background: white;">
              <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #1e3a8a; margin: 0; font-size: 24px; font-weight: 800;">WeVentureHub Invoice</h2>
                <p style="color: #64748b; margin: 4px 0 0 0; font-size: 13px;">Cycle Invoice Generated</p>
              </div>
              <p>Hello <strong>${billingDetails.name}</strong>,</p>
              <p>Your recurring subscription invoice for <strong>${workspace.name}</strong> has been generated.</p>
              
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0;">
                <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
                  <tr>
                    <td style="color: #64748b; padding-bottom: 8px;">Invoice Number:</td>
                    <td style="font-weight: bold; text-align: right; padding-bottom: 8px;">${invoiceNumber}</td>
                  </tr>
                  <tr>
                    <td style="color: #64748b; padding-bottom: 8px;">Space / Product:</td>
                    <td style="font-weight: bold; text-align: right; padding-bottom: 8px;">${workspace.name} (${booking.billingPlanName})</td>
                  </tr>
                  <tr>
                    <td style="color: #64748b; padding-bottom: 8px;">Due Date:</td>
                    <td style="font-weight: bold; text-align: right; padding-bottom: 8px; color: #ef4444;">${dueDate.toLocaleDateString()}</td>
                  </tr>
                  <tr style="border-top: 1px dashed #cbd5e1;">
                    <td style="color: #0f172a; font-weight: bold; padding-top: 10px;">Total Amount Due:</td>
                    <td style="font-weight: bold; text-align: right; padding-top: 10px; font-size: 16px; color: #1e3a8a;">${price} ${currency}</td>
                  </tr>
                </table>
              </div>

              <p>Please pay this invoice before the due date to avoid service interruption or penalties.</p>

              <div style="text-align: center; margin-top: 24px;">
                <a href="${process.env.APP_URL || 'http://localhost:3000'}/#/dashboard/payments" style="background: #2563eb; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">Pay Invoice via Chapa</a>
              </div>
            </div>
          `;

          await emailService.sendEmail({
            to: booking.userEmail,
            subject: `[WeVentureHub] Recurring Invoice Generated - ${invoiceNumber}`,
            html: emailHtml,
          });

          // Create In-App Notification
          await notificationService.createNotification({
            tenantId: booking.tenantId,
            userId: booking.userId,
            title: 'Recurring Invoice Generated',
            message: `A new recurring invoice (${invoiceNumber}) for ${price} ${currency} is due on ${dueDate.toLocaleDateString()}.`,
            category: NotificationCategory.PAYMENT,
            link: `/#/dashboard/payments`,
          });
        }
      }
    } catch (err) {
      logger.error('❌ Error executing recurring invoice generation:', err);
    }
  }

  /**
   * 2. Automatic Reminders
   */
  public async checkOverdueInvoices() {
    logger.info('⏰ Running Overdue Invoice Reminders check...');
    try {
      const now = new Date();

      // Find unpaid invoices whose due date has passed or is approaching
      const unpaidInvoices = await Invoice.find({
        status: InvoiceStatus.UNPAID,
      }).exec();

      for (const invoice of unpaidInvoices) {
        if (!invoice.dueDate) continue;

        const isOverdue = now.getTime() > invoice.dueDate.getTime();
        const diffDays = Math.ceil((invoice.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (isOverdue) {
          logger.info(`⚠️ Invoice ${invoice.invoiceNumber} is OVERDUE. Dispatching alerts...`);

          const emailHtml = `
            <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #fca5a5; border-radius: 16px; background: white;">
              <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #dc2626; margin: 0; font-size: 24px; font-weight: 800;">⚠️ OVERDUE INVOICE NOTICE</h2>
                <p style="color: #dc2626; margin: 4px 0 0 0; font-size: 13px; font-weight: bold;">Immediate Action Required</p>
              </div>
              <p>Hello <strong>${invoice.billingDetails.name}</strong>,</p>
              <p>This is an automated notice that your invoice is now <strong>OVERDUE</strong>.</p>
              
              <div style="background: #fef2f2; border: 1px solid #fee2e2; border-radius: 12px; padding: 16px; margin: 20px 0;">
                <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
                  <tr>
                    <td style="color: #7f1d1d; padding-bottom: 8px;">Invoice Number:</td>
                    <td style="font-weight: bold; text-align: right; padding-bottom: 8px; color: #7f1d1d;">${invoice.invoiceNumber}</td>
                  </tr>
                  <tr>
                    <td style="color: #7f1d1d; padding-bottom: 8px;">Original Due Date:</td>
                    <td style="font-weight: bold; text-align: right; padding-bottom: 8px; color: #ef4444;">${invoice.dueDate.toLocaleDateString()}</td>
                  </tr>
                  <tr style="border-top: 1px dashed #fca5a5;">
                    <td style="color: #7f1d1d; font-weight: bold; padding-top: 10px;">Total Amount Owed:</td>
                    <td style="font-weight: bold; text-align: right; padding-top: 10px; font-size: 16px; color: #b91c1c;">${invoice.amount} ${invoice.currency}</td>
                  </tr>
                </table>
              </div>

              <p>Please complete payment immediately to avoid access restriction to our coworking facility.</p>

              <div style="text-align: center; margin-top: 24px;">
                <a href="${process.env.APP_URL || 'http://localhost:3000'}/#/dashboard/payments" style="background: #dc2626; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">Pay Overdue Balance</a>
              </div>
            </div>
          `;

          await emailService.sendEmail({
            to: invoice.userEmail,
            subject: `[⚠️ OVERDUE NOTICE] Pay Invoice ${invoice.invoiceNumber} - WeVentureHub`,
            html: emailHtml,
          });

          // Send real-time notification
          await notificationService.createNotification({
            tenantId: invoice.tenantId,
            userId: invoice.userId,
            title: '⚠️ Overdue Invoice Alert',
            message: `Your invoice (${invoice.invoiceNumber}) is overdue. Please complete payment immediately to prevent suspension.`,
            category: NotificationCategory.SYSTEM,
            link: `/#/dashboard/payments`,
          });
        } else if (diffDays === 1 || diffDays === 2) {
          logger.info(`⏰ Invoice ${invoice.invoiceNumber} is due in ${diffDays} days. Dispatching reminder...`);

          const emailHtml = `
            <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #fde047; border-radius: 16px; background: white;">
              <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #a16207; margin: 0; font-size: 22px; font-weight: 800;">🔔 PAYMENT REMINDER</h2>
                <p style="color: #854d0e; margin: 4px 0 0 0; font-size: 13px;">Due in ${diffDays} days</p>
              </div>
              <p>Hello <strong>${invoice.billingDetails.name}</strong>,</p>
              <p>This is a friendly reminder that your coworking invoice is due soon.</p>
              
              <div style="background: #fefcbf; border: 1px solid #fef08a; border-radius: 12px; padding: 16px; margin: 20px 0;">
                <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
                  <tr>
                    <td style="color: #713f12; padding-bottom: 8px;">Invoice Number:</td>
                    <td style="font-weight: bold; text-align: right; padding-bottom: 8px; color: #713f12;">${invoice.invoiceNumber}</td>
                  </tr>
                  <tr>
                    <td style="color: #713f12; padding-bottom: 8px;">Due Date:</td>
                    <td style="font-weight: bold; text-align: right; padding-bottom: 8px; color: #a16207;">${invoice.dueDate.toLocaleDateString()}</td>
                  </tr>
                  <tr style="border-top: 1px dashed #fef08a;">
                    <td style="color: #713f12; font-weight: bold; padding-top: 10px;">Total Amount:</td>
                    <td style="font-weight: bold; text-align: right; padding-top: 10px; font-size: 16px; color: #854d0e;">${invoice.amount} ${invoice.currency}</td>
                  </tr>
                </table>
              </div>

              <div style="text-align: center; margin-top: 24px;">
                <a href="${process.env.APP_URL || 'http://localhost:3000'}/#/dashboard/payments" style="background: #ca8a04; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">Pay Invoice</a>
              </div>
            </div>
          `;

          await emailService.sendEmail({
            to: invoice.userEmail,
            subject: `[Reminder] Invoice ${invoice.invoiceNumber} is due in ${diffDays} days`,
            html: emailHtml,
          });

          await notificationService.createNotification({
            tenantId: invoice.tenantId,
            userId: invoice.userId,
            title: 'Payment Reminder',
            message: `Your invoice (${invoice.invoiceNumber}) is due in ${diffDays} days on ${invoice.dueDate.toLocaleDateString()}.`,
            category: NotificationCategory.PAYMENT,
            link: `/#/dashboard/payments`,
          });
        }
      }
    } catch (err) {
      logger.error('❌ Error executing overdue invoice checks:', err);
    }
  }

  /**
   * 3. Agreement Renewal Notifications
   */
  public async checkAgreementRenewals() {
    logger.info('⏰ Running Coworking Agreement Renewal check...');
    try {
      const now = new Date();
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(now.getDate() + 7);

      // Find active bookings ending within 7 days
      const expiringBookings = await Booking.find({
        status: 'CONFIRMED',
        endTime: { $gt: now, $lte: sevenDaysFromNow },
      }).exec();

      for (const booking of expiringBookings) {
        const workspace = await Workspace.findById(booking.spaceId).exec();
        if (!workspace) continue;

        // Skip hourly bookings for renewal notifications
        if (booking.billingPlanName === 'Hourly') continue;

        logger.info(`🔔 Booking ${booking.id} for space ${workspace.name} expires on ${booking.endTime.toLocaleDateString()}. Notifying user...`);

        const emailHtml = `
          <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #cbd5e1; border-radius: 16px; background: white;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #2563eb; margin: 0; font-size: 22px; font-weight: 800;">📝 AGREEMENT EXPIRATION</h2>
              <p style="color: #64748b; margin: 4px 0 0 0; font-size: 13px;">Your Agreement is Expiring Soon</p>
            </div>
            <p>Hello <strong>${booking.billingDetails?.name || booking.userEmail.split('@')[0]}</strong>,</p>
            <p>Your current Coworking Agreement for space <strong>${workspace.name}</strong> is scheduled to expire on <strong>${booking.endTime.toLocaleDateString()}</strong>.</p>
            
            <p>To ensure uninterrupted access to your dedicated coworking facilities and maintain your current pricing tier, please renew your agreement before the expiration date.</p>

            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0;">
              <table style="width: 100%; font-size: 13px;">
                <tr>
                  <td style="color: #64748b;">Reserved Workspace:</td>
                  <td style="font-weight: bold; text-align: right;">${workspace.name}</td>
                </tr>
                <tr>
                  <td style="color: #64748b;">Billing Cycle:</td>
                  <td style="font-weight: bold; text-align: right;">${booking.billingPlanName || 'Standard'}</td>
                </tr>
                <tr>
                  <td style="color: #64748b;">Expiration Date:</td>
                  <td style="font-weight: bold; text-align: right; color: #ef4444;">${booking.endTime.toLocaleDateString()}</td>
                </tr>
              </table>
            </div>

            <div style="text-align: center; margin-top: 24px;">
              <a href="${process.env.APP_URL || 'http://localhost:3000'}/#/dashboard/bookings" style="background: #2563eb; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">Renew Agreement Now</a>
            </div>
          </div>
        `;

        await emailService.sendEmail({
          to: booking.userEmail,
          subject: `[Action Required] Your Coworking Agreement for ${workspace.name} is Expiring Soon`,
          html: emailHtml,
        });

        await notificationService.createNotification({
          tenantId: booking.tenantId,
          userId: booking.userId,
          title: '📝 Agreement Expiring Soon',
          message: `Your agreement for ${workspace.name} expires on ${booking.endTime.toLocaleDateString()}. Click here to renew.`,
          category: NotificationCategory.SYSTEM,
          link: `/#/dashboard/bookings`,
        });
      }
    } catch (err) {
      logger.error('❌ Error executing agreement renewal checks:', err);
    }
  }
}

export const billingSchedulerService = new BillingSchedulerService();
