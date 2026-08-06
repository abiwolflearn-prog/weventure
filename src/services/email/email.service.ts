import fs from 'fs';
import path from 'path';
import { getResendClient } from './resend.client';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content?: string | Buffer;
    path?: string;
  }>;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  provider: 'resend' | 'nodemailer_fallback' | 'simulated';
  error?: string;
}

export class ResendEmailService {
  private templateCache: Map<string, string> = new Map();
  private recentEmailHashes: Map<string, number> = new Map();
  private readonly DUP_WINDOW_MS = 5000; // 5 seconds deduplication window

  /**
   * Load and parse an HTML template from file system or memory cache
   */
  private loadTemplate(templateName: string): string {
    if (this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName)!;
    }

    try {
      const templatePath = path.join(__dirname, 'templates', `${templateName}.html`);
      if (fs.existsSync(templatePath)) {
        const content = fs.readFileSync(templatePath, 'utf-8');
        this.templateCache.set(templateName, content);
        return content;
      }
    } catch (err: any) {
      logger.error(`❌ Error reading template ${templateName}:`, err.message);
    }

    return '';
  }

  /**
   * Render dynamic HTML template by replacing {{variable}} placeholders
   */
  public renderTemplate(templateName: string, data: Record<string, any>): string {
    let rawHtml = this.loadTemplate(templateName);
    
    if (!rawHtml) {
      logger.warn(`⚠️ Template ${templateName}.html not found on disk, using basic container.`);
      rawHtml = `
        <div style="font-family: sans-serif; padding: 20px; background: #0f172a; color: #f8fafc;">
          <h2>WeVentureHub Notification</h2>
          <div>{{content}}</div>
          <p style="font-size: 12px; color: #64748b; margin-top: 20px;">WeVentureHub Workspace & Event Platform</p>
        </div>
      `;
    }

    const frontendUrl = env.FRONTEND_URL || env.APP_URL || 'http://localhost:3000';
    const appName = env.APP_NAME || 'WeVentureHub';
    const companyEmail = env.COMPANY_EMAIL || env.ADMIN_EMAIL || 'abiwolflearn@gmail.com';

    const mergedData: Record<string, any> = {
      frontendUrl,
      appName,
      companyEmail,
      currentYear: new Date().getFullYear().toString(),
      adminDashboardUrl: `${frontendUrl}/#/admin/workspace-reservations`,
      bookingUrl: `${frontendUrl}/#/dashboard/bookings`,
      exploreUrl: `${frontendUrl}/#/workspaces`,
      loginUrl: `${frontendUrl}/#/login`,
      agreementUrl: `${frontendUrl}/#/dashboard/agreements`,
      paymentUrl: `${frontendUrl}/#/dashboard/payments`,
      receiptUrl: `${frontendUrl}/#/dashboard/invoices`,
      ...data,
    };

    let rendered = rawHtml;
    for (const [key, value] of Object.entries(mergedData)) {
      const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      rendered = rendered.replace(placeholder, value !== undefined && value !== null ? String(value) : '');
    }

    return rendered;
  }

  /**
   * Deduplication check to prevent sending exact same email multiple times in tight loops
   */
  private isDuplicate(to: string | string[], subject: string): boolean {
    const recipientKey = Array.isArray(to) ? to.sort().join(',') : to;
    const hash = `${recipientKey.toLowerCase().trim()}:${subject.trim()}`;
    const now = Date.now();
    const lastSent = this.recentEmailHashes.get(hash);

    if (lastSent && now - lastSent < this.DUP_WINDOW_MS) {
      return true;
    }

    this.recentEmailHashes.set(hash, now);

    // Cleanup old hashes periodically
    if (this.recentEmailHashes.size > 200) {
      for (const [k, timestamp] of this.recentEmailHashes.entries()) {
        if (now - timestamp > this.DUP_WINDOW_MS * 2) {
          this.recentEmailHashes.delete(k);
        }
      }
    }

    return false;
  }

  /**
   * Primary transactional email dispatch via Resend
   */
  public async sendEmail(options: SendEmailOptions): Promise<EmailSendResult> {
    const { to, subject, html, text, from, replyTo } = options;

    const recipientList = Array.isArray(to) ? to : [to];
    const cleanRecipients = recipientList.map(e => e.trim()).filter(e => e.length > 0);

    if (cleanRecipients.length === 0) {
      logger.error('❌ Cannot send email: No valid recipient provided');
      return { success: false, provider: 'simulated', error: 'No recipient' };
    }

    // Check duplicate
    if (this.isDuplicate(cleanRecipients, subject)) {
      logger.warn(`⚠️ Duplicate email prevented within ${this.DUP_WINDOW_MS}ms window: "${subject}" to ${cleanRecipients.join(', ')}`);
      return { success: true, messageId: 'dedup-skipped', provider: 'resend' };
    }

    const defaultFrom = env.EMAIL_FROM || 'WeVentureHub <onboarding@resend.dev>';
    const senderEmail = from || defaultFrom;
    const resend = getResendClient();

    let finalRecipients = [...cleanRecipients];
    if (env.EMAIL_TEST_MODE) {
      const originalRecipientsStr = cleanRecipients.join(', ');
      finalRecipients = [env.EMAIL_TEST_RECIPIENT];
      logger.info(`[EMAIL TEST MODE]\nOriginal recipient: ${originalRecipientsStr}\nRedirected recipient: ${env.EMAIL_TEST_RECIPIENT}`);
      logger.info(`Email redirected from ${originalRecipientsStr} to test recipient ${env.EMAIL_TEST_RECIPIENT}`);
    }

    if (resend) {
      try {
        logger.info(`📧 Sending email via Resend to ${finalRecipients.join(', ')} | Subject: "${subject}" | From: ${senderEmail}`);

        const data = await resend.emails.send({
          from: senderEmail,
          to: finalRecipients,
          subject,
          html,
          text: text || html.replace(/<[^>]*>?/gm, ''),
          replyTo: replyTo || env.ADMIN_EMAIL || 'abiwolflearn@gmail.com',
        });

        if (data.error) {
          logger.error(`❌ Resend API Error (${data.error.name}): ${data.error.message}`);
          return {
            success: false,
            provider: 'resend',
            error: data.error.message,
          };
        }

        logger.info(`✅ Email delivered via Resend | ID: ${data.data?.id}`);
        return {
          success: true,
          messageId: data.data?.id,
          provider: 'resend',
        };
      } catch (err: any) {
        logger.error(`❌ Resend Exception: ${err.message || err}`);
        return {
          success: false,
          provider: 'resend',
          error: err.message || 'Resend exception',
        };
      }
    }

    // Fallback mode when RESEND_API_KEY is not configured
    logger.info(`ℹ️ [Resend Not Configured] Simulating email delivery to ${finalRecipients.join(', ')} | Subject: "${subject}"`);
    return {
      success: true,
      messageId: `sim_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      provider: 'simulated',
    };
  }

  // ==========================================
  // TRANSACTIONAL EMAIL TRIGGER METHODS
  // ==========================================

  /**
   * 1. Welcome Email
   */
  public async sendWelcomeEmail(user: { email: string; firstName?: string; lastName?: string; name?: string }): Promise<EmailSendResult> {
    const userName = user.firstName || user.name || user.email.split('@')[0];
    const html = this.renderTemplate('welcome', { userName });

    return this.sendEmail({
      to: user.email,
      subject: `Welcome to ${env.APP_NAME || 'WeVentureHub'}! 🚀`,
      html,
    });
  }

  /**
   * 2. Email Verification Email
   */
  public async sendEmailVerification(
    user: { email: string; firstName?: string; name?: string },
    verificationToken: string,
    otpCode: string,
    expiryMinutes = 60
  ): Promise<EmailSendResult> {
    const userName = user.firstName || user.name || user.email.split('@')[0];
    const frontendUrl = env.FRONTEND_URL || env.APP_URL || 'http://localhost:3000';
    const verifyUrl = `${frontendUrl}/#/verify-email?token=${verificationToken}&email=${encodeURIComponent(user.email)}`;

    const html = this.renderTemplate('verify-email', {
      userName,
      otpCode,
      verifyUrl,
      expiryMinutes,
    });

    return this.sendEmail({
      to: user.email,
      subject: `[${env.APP_NAME || 'WeVentureHub'}] Verify Your Email - Code: ${otpCode}`,
      html,
    });
  }

  /**
   * 3. Customer Reservation Confirmation
   */
  public async sendReservationConfirmation(
    booking: any,
    user: { email: string; firstName?: string; lastName?: string; name?: string },
    workspaceName: string
  ): Promise<EmailSendResult> {
    const userName = user.firstName || user.name || user.email.split('@')[0];
    const reservationId = booking.id || booking._id || 'RES-REF';
    const duration = booking.durationQuantity && booking.durationType 
      ? `${booking.durationQuantity} ${booking.durationType}(s)`
      : `${new Date(booking.startTime).toLocaleString()} - ${new Date(booking.endTime).toLocaleString()}`;
    const pricing = `${booking.totalAmount || booking.amount || 0} ${booking.currency || 'ETB'}`;
    const reservationDate = new Date(booking.startTime || Date.now()).toLocaleDateString();

    const html = this.renderTemplate('reservation-confirmation', {
      userName,
      reservationId,
      workspaceName,
      duration,
      pricing,
      reservationDate,
    });

    return this.sendEmail({
      to: user.email,
      subject: `[${env.APP_NAME || 'WeVentureHub'}] Workspace Reservation Received (#${reservationId})`,
      html,
    });
  }

  /**
   * 4. Admin Reservation Alert Notification
   */
  public async sendReservationAdminNotification(
    booking: any,
    user: { email: string; firstName?: string; lastName?: string; name?: string; phone?: string },
    workspaceName: string
  ): Promise<EmailSendResult> {
    const customerName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email.split('@')[0];
    const customerEmail = user.email || booking.billingDetails?.email || booking.userEmail;
    const customerPhone = user.phone || booking.billingDetails?.phone || 'Not provided';
    const reservationId = booking.id || booking._id || 'RES-REF';
    const duration = booking.durationQuantity && booking.durationType 
      ? `${booking.durationQuantity} ${booking.durationType}(s)`
      : `${new Date(booking.startTime).toLocaleString()} - ${new Date(booking.endTime).toLocaleString()}`;
    const pricing = `${booking.totalAmount || booking.amount || 0} ${booking.currency || 'ETB'}`;
    const reservationDate = new Date(booking.startTime || Date.now()).toLocaleDateString();
    const submittedTime = new Date(booking.createdAt || Date.now()).toLocaleString();

    const html = this.renderTemplate('reservation-admin', {
      reservationId,
      customerName,
      customerEmail,
      customerPhone,
      workspaceName,
      duration,
      pricing,
      reservationDate,
      submittedTime,
    });

    const adminEmail = env.ADMIN_EMAIL || 'abiwolflearn@gmail.com';

    return this.sendEmail({
      to: adminEmail,
      subject: `⚡ [ADMIN ALERT] New Workspace Reservation #${reservationId} - ${customerName}`,
      html,
    });
  }

  /**
   * 5. Booking Approved
   */
  public async sendBookingApproved(
    booking: any,
    user: { email: string; name?: string; firstName?: string },
    workspaceName: string
  ): Promise<EmailSendResult> {
    const userName = user.firstName || user.name || user.email.split('@')[0];
    const reservationId = booking.id || booking._id || 'RES-REF';
    const duration = booking.durationQuantity && booking.durationType 
      ? `${booking.durationQuantity} ${booking.durationType}(s)`
      : `${new Date(booking.startTime).toLocaleString()} - ${new Date(booking.endTime).toLocaleString()}`;
    const pricing = `${booking.totalAmount || booking.amount || 0} ${booking.currency || 'ETB'}`;
    const reservationDate = new Date(booking.startTime || Date.now()).toLocaleDateString();
    const agreementNumber = booking.agreementNumber || 'AGR-AUTO';

    const html = this.renderTemplate('booking-approved', {
      userName,
      reservationId,
      workspaceName,
      duration,
      pricing,
      reservationDate,
      agreementNumber,
    });

    return this.sendEmail({
      to: user.email,
      subject: `🎉 [${env.APP_NAME || 'WeVentureHub'}] Reservation Approved for ${workspaceName} (#${reservationId})`,
      html,
    });
  }

  /**
   * 6. Booking Rejected
   */
  public async sendBookingRejected(
    booking: any,
    user: { email: string; name?: string; firstName?: string },
    workspaceName: string,
    reason?: string
  ): Promise<EmailSendResult> {
    const userName = user.firstName || user.name || user.email.split('@')[0];
    const reservationId = booking.id || booking._id || 'RES-REF';
    const rejectionReason = reason || 'The requested workspace slot is temporarily unavailable or requires scheduling adjustment.';

    const html = this.renderTemplate('booking-rejected', {
      userName,
      reservationId,
      workspaceName,
      reason: rejectionReason,
    });

    return this.sendEmail({
      to: user.email,
      subject: `[${env.APP_NAME || 'WeVentureHub'}] Workspace Reservation Update (#${reservationId})`,
      html,
    });
  }

  /**
   * 7. Agreement Ready
   */
  public async sendAgreementReady(
    agreement: any,
    user: { email: string; name?: string; firstName?: string },
    workspaceName: string
  ): Promise<EmailSendResult> {
    const userName = user.firstName || user.name || user.email.split('@')[0];
    const agreementNumber = agreement.agreementNumber || 'AGR-REF';
    const startDate = new Date(agreement.startDate || Date.now()).toLocaleDateString();
    const endDate = new Date(agreement.endDate || Date.now()).toLocaleDateString();
    const paymentTerms = agreement.paymentTerms || 'Monthly Advance / Scheduled Invoicing';

    const html = this.renderTemplate('agreement', {
      userName,
      agreementNumber,
      workspaceName,
      startDate,
      endDate,
      paymentTerms,
    });

    return this.sendEmail({
      to: user.email,
      subject: `[${env.APP_NAME || 'WeVentureHub'}] Tenancy Agreement Ready for Review (#${agreementNumber})`,
      html,
    });
  }

  /**
   * 8. Invoice Generated
   */
  public async sendInvoiceGenerated(
    invoice: any,
    user: { email: string; name?: string; firstName?: string }
  ): Promise<EmailSendResult> {
    const userName = user.firstName || user.name || user.email.split('@')[0];
    const invoiceNumber = invoice.invoiceNumber || 'INV-REF';
    const billingPeriod = invoice.billingPeriod || new Date().toLocaleDateString();
    const dueDate = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'Due on Receipt';
    const amount = invoice.grandTotal || invoice.amount || 0;
    const currency = invoice.currency || 'ETB';

    const html = this.renderTemplate('invoice', {
      userName,
      invoiceNumber,
      billingPeriod,
      dueDate,
      amount,
      currency,
    });

    return this.sendEmail({
      to: user.email,
      subject: `[${env.APP_NAME || 'WeVentureHub'}] Invoice Statement Generated (#${invoiceNumber})`,
      html,
    });
  }

  /**
   * 9. Payment Reminder
   */
  public async sendPaymentReminder(
    invoice: any,
    user: { email: string; name?: string; firstName?: string },
    reminderStage = 'Standard'
  ): Promise<EmailSendResult> {
    const userName = user.firstName || user.name || user.email.split('@')[0];
    const invoiceNumber = invoice.invoiceNumber || 'INV-REF';
    const dueDate = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'Immediate';
    const amount = invoice.outstandingBalance || invoice.grandTotal || invoice.amount || 0;
    const currency = invoice.currency || 'ETB';

    const html = this.renderTemplate('payment-reminder', {
      userName,
      invoiceNumber,
      dueDate,
      amount,
      currency,
      reminderStage,
    });

    return this.sendEmail({
      to: user.email,
      subject: `⏰ [${env.APP_NAME || 'WeVentureHub'}] Payment Reminder: Invoice #${invoiceNumber}`,
      html,
    });
  }

  /**
   * 10. Payment Receipt
   */
  public async sendPaymentReceipt(
    payment: any,
    invoice: any,
    user: { email: string; name?: string; firstName?: string }
  ): Promise<EmailSendResult> {
    const userName = user.firstName || user.name || user.email.split('@')[0];
    const transactionRef = payment.txRef || payment.id || 'TXN-REF';
    const invoiceNumber = invoice?.invoiceNumber || payment.metadata?.invoiceNumber || 'INV-PAID';
    const paymentDate = new Date(payment.createdAt || Date.now()).toLocaleString();
    const paymentProvider = payment.provider || 'Electronic Payment';
    const amount = payment.amount || invoice?.grandTotal || 0;
    const currency = payment.currency || invoice?.currency || 'ETB';

    const html = this.renderTemplate('payment-receipt', {
      userName,
      transactionRef,
      invoiceNumber,
      paymentDate,
      paymentProvider,
      amount,
      currency,
    });

    return this.sendEmail({
      to: user.email,
      subject: `[${env.APP_NAME || 'WeVentureHub'}] Official Payment Receipt (#${transactionRef})`,
      html,
    });
  }

  /**
   * 11. Event Registration Confirmation
   */
  public async sendEventRegistrationConfirmation(
    registration: any,
    event: any,
    user: { email: string; name?: string; firstName?: string }
  ): Promise<EmailSendResult> {
    const userName = user.firstName || user.name || user.email.split('@')[0];
    const eventTitle = event.title || event.name || 'WeVentureHub Community Event';
    const ticketRef = registration.ticketCode || registration.id || 'TCK-REF';
    const eventDate = event.startDate ? new Date(event.startDate).toLocaleString() : 'TBA';
    const venue = event.location || 'WeVentureHub Main Event Hall';
    const ticketType = registration.ticketType || 'Standard Entry';

    const html = this.renderTemplate('event-registration', {
      userName,
      eventTitle,
      ticketRef,
      eventDate,
      venue,
      ticketType,
      eventUrl: `${env.FRONTEND_URL || 'http://localhost:3000'}/#/dashboard/tickets`,
    });

    return this.sendEmail({
      to: user.email,
      subject: `🎟️ [${env.APP_NAME || 'WeVentureHub'}] Event Registration Confirmed: ${eventTitle}`,
      html,
    });
  }

  /**
   * 12. Password Reset Email
   */
  public async sendPasswordReset(
    user: { email: string; name?: string; firstName?: string },
    resetToken: string,
    expiryMinutes = 30
  ): Promise<EmailSendResult> {
    const userName = user.firstName || user.name || user.email.split('@')[0];
    const frontendUrl = env.FRONTEND_URL || env.APP_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/#/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;

    const html = this.renderTemplate('password-reset', {
      userName,
      resetUrl,
      expiryMinutes,
    });

    return this.sendEmail({
      to: user.email,
      subject: `[${env.APP_NAME || 'WeVentureHub'}] Password Reset Instructions`,
      html,
    });
  }
}

export const resendEmailService = new ResendEmailService();
