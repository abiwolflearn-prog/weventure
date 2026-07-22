import { emailService } from './EmailService';
import { emailTemplateService } from './EmailTemplateService';
import { env } from '../config/env';
import { logger } from '../utils/logger';

class EmailNotificationManager {
  private appUrl = env.APP_URL || 'https://weventurehub.com';

  // --- 1. AUTHENTICATION ---
  public async sendWelcomeEmail(user: { email: string; firstName?: string; lastName?: string; name?: string }): Promise<void> {
    const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || 'Valued Member';
    await emailService.enqueueEmail({
      templateKey: 'welcome_email',
      recipientEmail: user.email,
      recipientName: userName,
      variables: {
        userName,
        userEmail: user.email,
        loginUrl: `${this.appUrl}/login`,
      },
      priority: 'high',
    });
  }

  public async sendEmailVerification(user: { email: string; firstName?: string; name?: string }, otpCode: string, expiryMinutes = 15): Promise<void> {
    const userName = user.firstName || user.name || 'Valued Member';
    await emailService.enqueueEmail({
      templateKey: 'email_verification',
      recipientEmail: user.email,
      recipientName: userName,
      variables: {
        userName,
        otpCode,
        expiryMinutes,
        verifyUrl: `${this.appUrl}/verify-email?code=${otpCode}&email=${encodeURIComponent(user.email)}`,
      },
      priority: 'high',
    });
  }

  public async sendPasswordReset(user: { email: string; firstName?: string; name?: string }, resetToken: string, expiryMinutes = 30): Promise<void> {
    const userName = user.firstName || user.name || 'Valued Member';
    await emailService.enqueueEmail({
      templateKey: 'password_reset',
      recipientEmail: user.email,
      recipientName: userName,
      variables: {
        userName,
        userEmail: user.email,
        expiryMinutes,
        resetUrl: `${this.appUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`,
      },
      priority: 'high',
    });
  }

  // --- 2. WORKSPACE BOOKINGS ---
  public async sendBookingReceived(booking: any, user: any, spaceName: string): Promise<void> {
    const userName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Client';
    const bookingId = booking._id?.toString() || booking.id || 'BK-1001';
    const startTime = booking.startTime ? new Date(booking.startTime).toLocaleString() : booking.startDate || 'N/A';
    const endTime = booking.endTime ? new Date(booking.endTime).toLocaleString() : booking.endDate || 'N/A';
    const totalAmount = `${booking.totalAmount || booking.amount || 0} ${booking.currency || 'ETB'}`;

    // Send to Customer
    await emailService.enqueueEmail({
      templateKey: 'booking_received_customer',
      recipientEmail: user.email,
      recipientName: userName,
      variables: {
        userName,
        bookingId,
        spaceName,
        startTime,
        endTime,
        totalAmount,
        bookingUrl: `${this.appUrl}/dashboard/bookings`,
      },
      priority: 'normal',
    });

    // Send to Admin
    const settings = await emailService.getSystemEmailSettings();
    const adminEmail = settings.adminEmails.primaryAdminEmail;
    await emailService.enqueueEmail({
      templateKey: 'booking_received_admin',
      recipientEmail: adminEmail,
      recipientName: 'WeVentureHub Reception Admin',
      variables: {
        userName,
        userEmail: user.email,
        bookingId,
        spaceName,
        startTime,
        endTime,
        totalAmount,
        adminApproveUrl: `${this.appUrl}/admin/bookings?bookingId=${bookingId}`,
      },
      priority: 'high',
    });
  }

  public async sendBookingApproved(booking: any, user: any, spaceName: string, agreementNumber?: string): Promise<void> {
    const userName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Client';
    const bookingId = booking._id?.toString() || booking.id || 'BK-1001';
    const startTime = booking.startTime ? new Date(booking.startTime).toLocaleString() : booking.startDate || 'N/A';
    const endTime = booking.endTime ? new Date(booking.endTime).toLocaleString() : booking.endDate || 'N/A';

    await emailService.enqueueEmail({
      templateKey: 'booking_approved',
      recipientEmail: user.email,
      recipientName: userName,
      variables: {
        userName,
        bookingId,
        spaceName,
        startTime,
        endTime,
        agreementNumber: agreementNumber || `AGR-${bookingId.substring(0, 6)}`,
        paymentStatus: booking.paymentStatus || 'Verified / Up to date',
        bookingUrl: `${this.appUrl}/dashboard/bookings`,
      },
      priority: 'high',
    });
  }

  public async sendBookingRejected(booking: any, user: any, spaceName: string, reason?: string): Promise<void> {
    const userName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Client';
    const bookingId = booking._id?.toString() || booking.id || 'BK-1001';

    await emailService.enqueueEmail({
      templateKey: 'booking_rejected',
      recipientEmail: user.email,
      recipientName: userName,
      variables: {
        userName,
        bookingId,
        spaceName,
        reason: reason || 'Space unavailable for requested schedule or conflicting event.',
        exploreUrl: `${this.appUrl}/workspaces`,
      },
      priority: 'normal',
    });
  }

  // --- 3. AGREEMENTS & INVOICES ---
  public async sendAgreementGenerated(agreement: any, user: any, spaceName: string): Promise<void> {
    const userName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Member';
    const agreementNumber = agreement.agreementNumber || agreement.id || 'AGR-9001';
    const startDate = agreement.startDate ? new Date(agreement.startDate).toLocaleDateString() : 'N/A';
    const endDate = agreement.endDate ? new Date(agreement.endDate).toLocaleDateString() : 'N/A';

    await emailService.enqueueEmail({
      templateKey: 'agreement_generated',
      recipientEmail: user.email,
      recipientName: userName,
      variables: {
        userName,
        agreementNumber,
        spaceName,
        startDate,
        endDate,
        paymentSchedule: agreement.paymentTerms || 'Monthly Advance Billing',
        downloadUrl: `${this.appUrl}/api/v1/agreements/${agreementNumber}/download`,
      },
      priority: 'normal',
    });
  }

  public async sendInvoiceGenerated(invoice: any, user: any): Promise<void> {
    const userName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Client';
    const invoiceNumber = invoice.invoiceNumber || invoice.id || 'INV-2001';
    const dueDate = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'Immediate';
    const billingPeriod = invoice.billingPeriod || 'Current Workspace Cycle';
    const amount = invoice.amount || 0;
    const balance = invoice.outstandingBalance ?? amount;
    const currency = invoice.currency || 'ETB';

    await emailService.enqueueEmail({
      templateKey: 'invoice_generated',
      recipientEmail: user.email,
      recipientName: userName,
      variables: {
        userName,
        invoiceNumber,
        billingPeriod,
        dueDate,
        amount,
        balance,
        currency,
        paymentUrl: `${this.appUrl}/dashboard/invoices?pay=${invoiceNumber}`,
        downloadUrl: `${this.appUrl}/api/v1/invoices/${invoiceNumber}/pdf`,
      },
      priority: 'high',
    });
  }

  public async sendPaymentReminder(invoice: any, user: any, reminderStage: string): Promise<void> {
    const userName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Client';
    const invoiceNumber = invoice.invoiceNumber || invoice.id || 'INV-2001';
    const dueDate = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'Today';
    const amount = invoice.outstandingBalance || invoice.amount || 0;
    const currency = invoice.currency || 'ETB';

    let reminderHeader = `Payment Reminder: Invoice #${invoiceNumber}`;
    let statusColor = '#3b82f6'; // Blue default

    if (reminderStage.includes('overdue')) {
      reminderHeader = `⚠️ OVERDUE PAYMENT NOTICE: Invoice #${invoiceNumber}`;
      statusColor = '#ef4444'; // Red
    } else if (reminderStage === 'due_today') {
      reminderHeader = `🔔 Payment Due Today: Invoice #${invoiceNumber}`;
      statusColor = '#d97706'; // Amber
    } else if (reminderStage.includes('3_days') || reminderStage.includes('1_day')) {
      reminderHeader = `Upcoming Payment Notice: Invoice #${invoiceNumber}`;
      statusColor = '#eab308';
    }

    await emailService.enqueueEmail({
      templateKey: 'payment_reminder',
      recipientEmail: user.email,
      recipientName: userName,
      variables: {
        userName,
        invoiceNumber,
        amount,
        currency,
        dueDate,
        reminderHeader,
        statusColor,
        paymentUrl: `${this.appUrl}/dashboard/invoices?pay=${invoiceNumber}`,
      },
      priority: reminderStage.includes('overdue') ? 'high' : 'normal',
      metadata: { reminderStage, invoiceNumber },
    });
  }

  public async sendPaymentSuccess(payment: any, invoice: any, user: any): Promise<void> {
    const userName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Client';
    const invoiceNumber = invoice?.invoiceNumber || payment.invoiceNumber || 'INV-2001';
    const transactionRef = payment.transactionRef || payment.reference || `TXN-${Date.now()}`;
    const amount = payment.amount || invoice?.amount || 0;
    const currency = payment.currency || 'ETB';
    const paymentMethod = payment.paymentMethod || 'ArifPay Online';
    const paymentDate = payment.paidAt ? new Date(payment.paidAt).toLocaleString() : new Date().toLocaleString();

    // Customer Email
    await emailService.enqueueEmail({
      templateKey: 'payment_success_customer',
      recipientEmail: user.email,
      recipientName: userName,
      variables: {
        userName,
        transactionRef,
        invoiceNumber,
        amount,
        currency,
        paymentMethod,
        paymentDate,
        receiptUrl: `${this.appUrl}/dashboard/invoices?receipt=${transactionRef}`,
      },
      priority: 'high',
    });

    // Admin Notification
    const settings = await emailService.getSystemEmailSettings();
    const adminEmail = settings.adminEmails.billingEmail || settings.adminEmails.primaryAdminEmail;
    await emailService.enqueueEmail({
      templateKey: 'admin_notification_generic',
      recipientEmail: adminEmail,
      recipientName: 'WeVentureHub Finance Admin',
      variables: {
        eventTitle: `Payment Received (${amount} ${currency})`,
        message: `Payment successfully received from ${userName} (${user.email}) for Invoice #${invoiceNumber}. Ref: ${transactionRef}.`,
        adminUrl: `${this.appUrl}/admin/payments`,
      },
      priority: 'normal',
    });
  }

  public async sendPaymentFailed(invoice: any, user: any, reason?: string): Promise<void> {
    const userName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Client';
    const invoiceNumber = invoice.invoiceNumber || 'INV-2001';

    await emailService.enqueueEmail({
      templateKey: 'payment_failed',
      recipientEmail: user.email,
      recipientName: userName,
      variables: {
        userName,
        invoiceNumber,
        reason: reason || 'Insufficient funds, expired card session, or network interruption.',
        paymentUrl: `${this.appUrl}/dashboard/invoices?pay=${invoiceNumber}`,
      },
      priority: 'high',
    });
  }

  // --- 4. RENEWALS & EXPIRATION ---
  public async sendWorkspaceRenewalReminder(agreement: any, user: any, spaceName: string, daysRemaining: number): Promise<void> {
    const userName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Client';
    const agreementNumber = agreement.agreementNumber || agreement.id || 'AGR-1001';
    const expiryDate = agreement.endDate ? new Date(agreement.endDate).toLocaleDateString() : 'N/A';
    const renewalPrice = agreement.monthlyRate ? `${agreement.monthlyRate} ETB/month` : 'Standard Membership Rate';

    await emailService.enqueueEmail({
      templateKey: 'workspace_renewal',
      recipientEmail: user.email,
      recipientName: userName,
      variables: {
        userName,
        daysRemaining,
        expiryDate,
        agreementNumber,
        spaceName,
        renewalPrice,
        renewUrl: `${this.appUrl}/dashboard/renewals?agreement=${agreementNumber}`,
      },
      priority: daysRemaining <= 3 ? 'high' : 'normal',
    });
  }

  public async sendAgreementExpired(agreement: any, user: any, spaceName: string): Promise<void> {
    const userName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Client';
    const agreementNumber = agreement.agreementNumber || 'AGR-1001';
    const expiryDate = agreement.endDate ? new Date(agreement.endDate).toLocaleDateString() : 'Today';

    await emailService.enqueueEmail({
      templateKey: 'agreement_expired',
      recipientEmail: user.email,
      recipientName: userName,
      variables: {
        userName,
        agreementNumber,
        spaceName,
        expiryDate,
        renewUrl: `${this.appUrl}/workspaces`,
      },
      priority: 'high',
    });
  }

  // --- 5. EVENTS & TICKETS ---
  public async sendEventRegistrationConfirmation(registration: any, event: any, user: any): Promise<void> {
    const userName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Attendee';
    const ticketNumber = registration.ticketNumber || registration.id || 'TCK-8001';
    const eventTitle = event.title || 'WeVentureHub Workshop';
    const dateRange = event.schedule?.startDate ? new Date(event.schedule.startDate).toLocaleString() : 'TBD';
    const location = event.location?.name || 'WeVentureHub Main Event Hall';
    const organizerName = event.organizer?.name || 'WeVentureHub Community Desk';

    await emailService.enqueueEmail({
      templateKey: 'event_registration_confirmation',
      recipientEmail: user.email,
      recipientName: userName,
      variables: {
        userName,
        ticketNumber,
        eventTitle,
        dateRange,
        location,
        organizerName,
        ticketUrl: `${this.appUrl}/dashboard/events?ticket=${ticketNumber}`,
      },
      priority: 'high',
    });
  }

  public async sendEventReminder(registration: any, event: any, user: any, hoursBefore: number): Promise<void> {
    const userName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Attendee';
    const eventTitle = event.title || 'WeVentureHub Event';
    const dateRange = event.schedule?.startDate ? new Date(event.schedule.startDate).toLocaleString() : 'Today';
    const location = event.location?.name || 'WeVentureHub Event Hall, Airport Road, Sur Construction 2nd Floor, Addis Ababa';
    const organizerName = event.organizer?.name || 'WeVentureHub Team';

    await emailService.enqueueEmail({
      templateKey: 'event_reminder',
      recipientEmail: user.email,
      recipientName: userName,
      variables: {
        userName,
        eventTitle,
        timeRemaining: `${hoursBefore} Hours`,
        dateRange,
        location,
        organizerName,
        mapsUrl: 'https://maps.google.com/?q=WeVentureHub+Addis+Ababa',
      },
      priority: 'high',
    });
  }

  // --- 6. CONTACT & AI ESCALATION ---
  public async sendContactFormNotification(contactData: {
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    subject: string;
    message: string;
  }): Promise<void> {
    // 1. Admin Alert
    const settings = await emailService.getSystemEmailSettings();
    const adminEmail = settings.adminEmails.contactEmail || settings.adminEmails.primaryAdminEmail;
    await emailService.enqueueEmail({
      templateKey: 'contact_form_admin',
      recipientEmail: adminEmail,
      recipientName: 'WeVentureHub Front Desk',
      variables: {
        customerName: contactData.customerName,
        customerEmail: contactData.customerEmail,
        customerPhone: contactData.customerPhone || 'N/A',
        subject: contactData.subject,
        messageContent: contactData.message,
      },
      priority: 'high',
    });

    // 2. Customer Confirmation
    await emailService.enqueueEmail({
      templateKey: 'contact_form_customer',
      recipientEmail: contactData.customerEmail,
      recipientName: contactData.customerName,
      variables: {
        customerName: contactData.customerName,
        subject: contactData.subject,
      },
      priority: 'normal',
    });
  }

  public async sendAiChatbotEscalation(ticket: any, userInquiry: string): Promise<void> {
    const ticketNumber = ticket.ticketNumber || ticket.id || 'TKT-3001';
    const customerName = ticket.userName || 'WeVentureHub Member';
    const customerEmail = ticket.userEmail || ticket.email;
    const subject = ticket.subject || 'AI Support Escalation Request';

    // Admin Notification
    const settings = await emailService.getSystemEmailSettings();
    const adminEmail = settings.adminEmails.supportEmail || settings.adminEmails.primaryAdminEmail;
    await emailService.enqueueEmail({
      templateKey: 'ai_chatbot_escalation_admin',
      recipientEmail: adminEmail,
      recipientName: 'WeVentureHub Support Operator',
      variables: {
        ticketNumber,
        customerName,
        customerEmail,
        subject,
        userInquiry,
        ticketUrl: `${this.appUrl}/admin/support?ticketId=${ticketNumber}`,
      },
      priority: 'high',
    });

    // Customer Notification
    if (customerEmail) {
      await emailService.enqueueEmail({
        templateKey: 'ai_chatbot_escalation_customer',
        recipientEmail: customerEmail,
        recipientName: customerName,
        variables: {
          customerName,
          ticketNumber,
          ticketUrl: `${this.appUrl}/dashboard/support?ticketId=${ticketNumber}`,
        },
        priority: 'high',
      });
    }
  }

  // --- 7. ADMIN SYSTEM NOTIFICATIONS ---
  public async sendNewUserRegistrationAdminAlert(user: any): Promise<void> {
    const settings = await emailService.getSystemEmailSettings();
    const adminEmail = settings.adminEmails.primaryAdminEmail;
    const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'New User';
    await emailService.enqueueEmail({
      templateKey: 'admin_notification_generic',
      recipientEmail: adminEmail,
      recipientName: 'WeVentureHub Community Admin',
      variables: {
        eventTitle: 'New User Registration',
        message: `New member registered: ${userName} (${user.email}). Role: ${user.role || 'HUB_MEMBER'}.`,
        adminUrl: `${this.appUrl}/admin/users`,
      },
      priority: 'normal',
    });
  }

  public async sendAdminNotification(eventTitle: string, message: string): Promise<void> {
    const settings = await emailService.getSystemEmailSettings();
    const adminEmail = settings.adminEmails.primaryAdminEmail;
    await emailService.enqueueEmail({
      templateKey: 'admin_notification_generic',
      recipientEmail: adminEmail,
      recipientName: 'WeVentureHub Administrator',
      variables: {
        eventTitle,
        message,
        adminUrl: `${this.appUrl}/admin`,
      },
      priority: 'normal',
    });
  }
}

export const emailNotificationManager = new EmailNotificationManager();
