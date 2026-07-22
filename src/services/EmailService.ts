import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { EmailLog } from '../models/EmailLog';
import { EmailQueue, QueuePriority } from '../models/EmailQueue';
import { EmailPreference } from '../models/EmailPreference';
import { SystemEmailSettings, ISystemEmailSettings } from '../models/SystemEmailSettings';
import { emailTemplateService } from './EmailTemplateService';

export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length < 5 || trimmed.length > 254) return false;
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(trimmed);
}

export interface EmailPayload {
  to: string;
  recipientName?: string;
  subject: string;
  html: string;
  text?: string;
  category?: string;
  templateKey?: string;
  tenantId?: string;
  attachments?: Array<{
    filename: string;
    content?: any;
    path?: string;
    contentType?: string;
  }>;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initTransporter();
  }

  public async getSystemEmailSettings(tenantId = 'weventurehub'): Promise<ISystemEmailSettings> {
    try {
      const settings = await (SystemEmailSettings as any).findOne({ tenantId }).lean();
      if (settings && settings.adminEmails && settings.senders) {
        return settings;
      }
      return {
        tenantId,
        adminEmails: {
          primaryAdminEmail: env.ADMIN_EMAIL || 'admin@weventurehub.com',
          secondaryAdminEmail: 'operations@weventurehub.com',
          billingEmail: 'billing@weventurehub.com',
          supportEmail: 'support@weventurehub.com',
          contactEmail: 'contact@weventurehub.com',
        },
        senders: {
          defaultSender: env.SMTP_FROM || 'WeVentureHub <noreply@weventurehub.com>',
          supportSender: 'WeVentureHub Support <support@weventurehub.com>',
          billingSender: 'WeVentureHub Billing <billing@weventurehub.com>',
          notificationsSender: 'WeVentureHub Notifications <notifications@weventurehub.com>',
        },
      };
    } catch (err) {
      return {
        tenantId,
        adminEmails: {
          primaryAdminEmail: env.ADMIN_EMAIL || 'admin@weventurehub.com',
          secondaryAdminEmail: 'operations@weventurehub.com',
          billingEmail: 'billing@weventurehub.com',
          supportEmail: 'support@weventurehub.com',
          contactEmail: 'contact@weventurehub.com',
        },
        senders: {
          defaultSender: env.SMTP_FROM || 'WeVentureHub <noreply@weventurehub.com>',
          supportSender: 'WeVentureHub Support <support@weventurehub.com>',
          billingSender: 'WeVentureHub Billing <billing@weventurehub.com>',
          notificationsSender: 'WeVentureHub Notifications <notifications@weventurehub.com>',
        },
      };
    }
  }

  public initTransporter(customConfig?: { host?: string; port?: number; user?: string; pass?: string; from?: string }) {
    try {
      const host = customConfig?.host || env.SMTP_HOST;
      const port = customConfig?.port || env.SMTP_PORT;
      const user = customConfig?.user || env.SMTP_USER;
      const pass = customConfig?.pass || env.SMTP_PASS;

      const config = {
        host,
        port,
        secure: port === 465,
        auth: user && pass ? { user, pass } : undefined,
      };

      this.transporter = nodemailer.createTransport(config);
      logger.info(`📧 Email Service transport initialized with SMTP: ${host}:${port}`);
    } catch (error) {
      logger.error('❌ Failed to initialize Nodemailer SMTP transport, emails will operate in fallback mode', error);
    }
  }

  /**
   * Check user notification preferences before sending
   */
  public async isEmailAllowed(recipientEmail: string, category: string): Promise<boolean> {
    try {
      if (!recipientEmail) return false;
      const pref = await (EmailPreference as any).findOne({ userEmail: recipientEmail.toLowerCase() }).lean();
      if (!pref) return true; // Default allowed if no preference document exists yet

      switch (category) {
        case 'auth':
          return true; // Always send auth & security emails
        case 'invoice':
        case 'renewal':
          return pref.paymentReminders;
        case 'booking':
          return pref.bookingAlerts;
        case 'event':
          return pref.eventUpdates;
        case 'support':
        case 'admin':
          return true;
        default:
          return pref.marketingEmails;
      }
    } catch (err) {
      return true; // Default allow on error
    }
  }

  /**
   * Send email immediately with logging to EmailLog DB
   */
  public async sendEmail(payload: EmailPayload, retries = 3, delay = 1000): Promise<boolean> {
    const tenantId = payload.tenantId || 'weventurehub';
    const category = payload.category || 'booking';
    const templateKey = payload.templateKey || 'generic_notification';

    // Validate email format
    if (!isValidEmail(payload.to)) {
      const errMsg = `Invalid recipient email address format: "${payload.to}"`;
      logger.error(`❌ [EMAIL REJECTED] ${errMsg}`);
      await (EmailLog as any).create({
        tenantId,
        recipientEmail: payload.to || 'invalid@address',
        recipientName: payload.recipientName,
        subject: payload.subject,
        category,
        templateKey,
        status: 'failed',
        sentAt: new Date(),
        errorMessage: errMsg,
      });
      return false;
    }

    // Determine configurable sender address based on category
    const systemSettings = await this.getSystemEmailSettings(tenantId);
    let fromAddress = systemSettings.senders.defaultSender;
    if (category === 'billing' || category === 'invoice' || templateKey.includes('payment') || templateKey.includes('invoice')) {
      fromAddress = systemSettings.senders.billingSender;
    } else if (category === 'support' || templateKey.includes('support') || templateKey.includes('contact')) {
      fromAddress = systemSettings.senders.supportSender;
    } else if (category === 'notification' || category === 'auth' || templateKey.includes('welcome') || templateKey.includes('verification') || templateKey.includes('reset')) {
      fromAddress = systemSettings.senders.notificationsSender;
    }

    // Check user preferences
    const allowed = await this.isEmailAllowed(payload.to, category);
    if (!allowed) {
      logger.info(`🚫 [EMAIL SUPPRESSED] Recipient ${payload.to} opted out of ${category} notifications.`);
      return false;
    }

    let lastErrorMessage = '';
    let messageId = '';

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        if (!this.transporter) {
          throw new Error('SMTP Transport offline');
        }

        const info = await this.transporter.sendMail({
          from: fromAddress,
          to: payload.to,
          subject: payload.subject,
          html: payload.html,
          text: payload.text || 'View this email in an HTML-compatible email reader',
          attachments: payload.attachments,
        });

        messageId = info.messageId;
        logger.info(`📧 [EMAIL DELIVERED] ID: ${messageId} | Target: ${payload.to} | Subject: "${payload.subject}"`);

        // Log successful delivery
        await (EmailLog as any).create({
          tenantId,
          recipientEmail: payload.to.toLowerCase(),
          recipientName: payload.recipientName,
          subject: payload.subject,
          category,
          templateKey,
          status: 'delivered',
          sentAt: new Date(),
          messageId,
        });

        return true;
      } catch (error: any) {
        lastErrorMessage = error instanceof Error ? error.message : String(error);
        logger.warn(`⚠️ [EMAIL FAILURE] Attempt ${attempt}/${retries} to ${payload.to} failed: ${lastErrorMessage}`);

        if (attempt === retries) {
          logger.error(`❌ [EMAIL PERMANENT FAILURE] Delivery to ${payload.to} failed after ${retries} attempts.`);

          // Log failure
          await (EmailLog as any).create({
            tenantId,
            recipientEmail: payload.to.toLowerCase(),
            recipientName: payload.recipientName,
            subject: payload.subject,
            category,
            templateKey,
            status: 'failed',
            sentAt: new Date(),
            errorMessage: lastErrorMessage,
          });

          return false;
        }

        // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, delay * attempt));
      }
    }
    return false;
  }

  /**
   * Enqueue email into EmailQueue DB for async or scheduled processing
   */
  public async enqueueEmail(params: {
    tenantId?: string;
    templateKey: string;
    recipientEmail: string;
    recipientName?: string;
    variables: Record<string, any>;
    priority?: QueuePriority;
    scheduledFor?: Date;
    metadata?: Record<string, any>;
  }): Promise<string> {
    try {
      const tenantId = params.tenantId || 'weventurehub';

      if (!isValidEmail(params.recipientEmail)) {
        logger.error(`❌ [ENQUEUE REJECTED] Invalid recipient email address: "${params.recipientEmail}"`);
        throw new Error(`Invalid email address format: ${params.recipientEmail}`);
      }

      const rendered = await emailTemplateService.renderTemplate(params.templateKey, params.variables);

      const queueItem = await EmailQueue.create({
        tenantId,
        templateKey: params.templateKey,
        recipientEmail: params.recipientEmail.toLowerCase(),
        recipientName: params.recipientName || params.variables.userName,
        subject: rendered.subject,
        bodyHtml: rendered.html,
        variables: params.variables,
        priority: params.priority || 'normal',
        status: 'pending',
        scheduledFor: params.scheduledFor || new Date(),
        metadata: params.metadata,
      });

      logger.info(`📥 [EMAIL QUEUED] Key: ${params.templateKey} | Recipient: ${params.recipientEmail} | QueueId: ${queueItem.id}`);
      return queueItem.id;
    } catch (error) {
      logger.error('❌ Failed to enqueue email:', error);
      throw error;
    }
  }

  // --- COMPATIBILITY METHODS FOR EXISTING APP ---
  public getEventRegistrationTemplate(params: {
    userName: string;
    eventTitle: string;
    ticketNumber: string;
    dateRange: string;
    location: string;
    amount: string;
  }): string {
    return emailTemplateService.wrapInMasterLayout(`
      <h2>Admission Pass Confirmed</h2>
      <p>Hello <strong>${params.userName}</strong>,</p>
      <p>Your registration for <strong>${params.eventTitle}</strong> is successfully verified.</p>
      <table class="meta-table">
        <tr><td class="meta-label">Ticket Ref</td><td class="meta-value">${params.ticketNumber}</td></tr>
        <tr><td class="meta-label">Event</td><td class="meta-value">${params.eventTitle}</td></tr>
        <tr><td class="meta-label">Schedule</td><td class="meta-value">${params.dateRange}</td></tr>
        <tr><td class="meta-label">Venue Location</td><td class="meta-value">${params.location}</td></tr>
        <tr><td class="meta-label">Amount Paid</td><td class="meta-value">${params.amount}</td></tr>
      </table>
      <div class="btn-container">
        <a href="${env.APP_URL}/dashboard/events" class="btn">View Event Ticket</a>
      </div>
    `, undefined, 'Admission Pass Confirmed');
  }

  public getBookingConfirmationTemplate(params: {
    userName: string;
    spaceName: string;
    startTime: string;
    endTime: string;
    totalAmount: string;
    bookingId: string;
  }): string {
    return emailTemplateService.wrapInMasterLayout(`
      <h2>Workspace Reservation Confirmed</h2>
      <p>Hello <strong>${params.userName}</strong>,</p>
      <p>Your workspace reservation has been successfully confirmed.</p>
      <table class="meta-table">
        <tr><td class="meta-label">Reservation Ref</td><td class="meta-value">#${params.bookingId}</td></tr>
        <tr><td class="meta-label">Reserved Space</td><td class="meta-value">${params.spaceName}</td></tr>
        <tr><td class="meta-label">Start Time</td><td class="meta-value">${params.startTime}</td></tr>
        <tr><td class="meta-label">End Time</td><td class="meta-value">${params.endTime}</td></tr>
        <tr><td class="meta-label">Total Amount</td><td class="meta-value">${params.totalAmount}</td></tr>
      </table>
      <div class="btn-container">
        <a href="${env.APP_URL}/dashboard/bookings" class="btn">Manage Your Bookings</a>
      </div>
    `, undefined, 'Workspace Reservation Confirmed');
  }

  public getAnnouncementTemplate(params: { title: string; content: string }): string {
    return emailTemplateService.wrapInMasterLayout(`
      <h2>${params.title}</h2>
      <p>${params.content.replace(/\n/g, '<br>')}</p>
      <div class="btn-container">
        <a href="${env.APP_URL}/dashboard" class="btn">Open WeVentureHub</a>
      </div>
    `, undefined, params.title);
  }

  public getPendingApprovalTemplate(params: {
    userName: string;
    eventTitle: string;
    ticketNumber: string;
    dateRange: string;
    location: string;
  }): string {
    return emailTemplateService.wrapInMasterLayout(`
      <h2>Registration Pending Approval</h2>
      <p>Hello <strong>${params.userName}</strong>,</p>
      <p>Your registration request for <strong>${params.eventTitle}</strong> is pending review by the event organizers.</p>
      <table class="meta-table">
        <tr><td class="meta-label">Ticket Ref</td><td class="meta-value">${params.ticketNumber}</td></tr>
        <tr><td class="meta-label">Event Name</td><td class="meta-value">${params.eventTitle}</td></tr>
        <tr><td class="meta-label">Schedule</td><td class="meta-value">${params.dateRange}</td></tr>
        <tr><td class="meta-label">Location</td><td class="meta-value">${params.location}</td></tr>
      </table>
    `, undefined, 'Registration Pending Approval');
  }

  public getApprovalRejectedTemplate(params: { userName: string; eventTitle: string; ticketNumber: string }): string {
    return emailTemplateService.wrapInMasterLayout(`
      <h2>Registration Status Update</h2>
      <p>Hello <strong>${params.userName}</strong>,</p>
      <p>Your application for <strong>${params.eventTitle}</strong> (#${params.ticketNumber}) could not be approved at this time.</p>
    `, undefined, 'Registration Status Update');
  }

  public getEventInvitationTemplate(params: { userName: string; eventTitle: string; invitationUrl: string }): string {
    return emailTemplateService.wrapInMasterLayout(`
      <h2>Exclusive Event Invitation</h2>
      <p>Hello <strong>${params.userName}</strong>,</p>
      <p>You have been invited to register for private event: <strong>${params.eventTitle}</strong>.</p>
      <div class="btn-container">
        <a href="${params.invitationUrl}" class="btn">Register Spot Now</a>
      </div>
    `, undefined, 'Exclusive Event Invitation');
  }
}

export const emailService = new EmailService();
