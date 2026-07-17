import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    try {
      // Lazy-load SMTP configuration
      const config = {
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465, // true for 465, false for other ports
        auth: env.SMTP_USER && env.SMTP_PASS ? {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        } : undefined,
      };

      this.transporter = nodemailer.createTransport(config);
      logger.info(`📧 Email Service transport initialized with SMTP: ${env.SMTP_HOST}:${env.SMTP_PORT}`);
    } catch (error) {
      logger.error('❌ Failed to initialize Nodemailer SMTP transport, emails will operate in logging fallback mode', error);
    }
  }

  /**
   * Send mail with retries and exponential backoff
   */
  public async sendEmail(payload: EmailPayload, retries = 3, delay = 1000): Promise<boolean> {
    const fromAddress = env.SMTP_FROM || 'WeVentureHub <noreply@weventurehub.com>';
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        if (!this.transporter) {
          throw new Error('Email transport is offline');
        }

        // Send mail using initialized transporter
        const info = await this.transporter.sendMail({
          from: fromAddress,
          to: payload.to,
          subject: payload.subject,
          html: payload.html,
          text: payload.text || 'View this email in an HTML-compatible client',
        });

        logger.info(`📧 [EMAIL DELIVERED] ID: ${info.messageId} | Target: ${payload.to} | Subject: "${payload.subject}"`);
        return true;
      } catch (error) {
        logger.warn(`⚠️ [EMAIL FAILURE] Attempt ${attempt}/${retries} to ${payload.to} failed. Error: ${error instanceof Error ? error.message : error}`);
        
        if (attempt === retries) {
          logger.error(`❌ [EMAIL PERMANENT FAILURE] Delivery to ${payload.to} abandoned after ${retries} attempts.`);
          return false;
        }

        // Exponential backoff sleep
        await new Promise((resolve) => setTimeout(resolve, delay * attempt));
      }
    }
    return false;
  }

  /**
   * Generates a beautifully-styled enterprise HTML template for Event registrations
   */
  public getEventRegistrationTemplate(params: {
    userName: string;
    eventTitle: string;
    ticketNumber: string;
    dateRange: string;
    location: string;
    amount: string;
  }): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Inter', system-ui, sans-serif; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 20px; }
            .card { max-width: 600px; margin: 0 auto; background: white; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); }
            .header { background: #3b82f6; padding: 24px; text-align: center; color: white; }
            .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.025em; }
            .content { padding: 24px; line-height: 1.6; }
            .meta-box { background: #f1f5f9; border-radius: 12px; padding: 16px; margin: 20px 0; border: 1px solid #e2e8f0; }
            .meta-item { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
            .meta-item:last-child { margin-bottom: 0; border-top: 1px dashed #cbd5e1; pt-8px; margin-top: 8px; font-weight: bold; }
            .footer { background: #f8fafc; padding: 16px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }
            .btn { display: inline-block; padding: 10px 20px; background: #3b82f6; color: white !important; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 13px; margin-top: 12px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <h1>Admission Pass Confirmed</h1>
            </div>
            <div class="content">
              <p>Hello <strong>${params.userName}</strong>,</p>
              <p>Your registration for <strong>${params.eventTitle}</strong> is successfully verified. We have provisioned your active entry credential ticket below:</p>
              
              <div class="meta-box">
                <div class="meta-item"><span>Ticket Number</span> <strong>${params.ticketNumber}</strong></div>
                <div class="meta-item"><span>Event Title</span> <strong>${params.eventTitle}</strong></div>
                <div class="meta-item"><span>Date / Time</span> <span>${params.dateRange}</span></div>
                <div class="meta-item"><span>Location</span> <span>${params.location}</span></div>
                <div class="meta-item"><span>Charge Amount</span> <strong>${params.amount}</strong></div>
              </div>
              
              <p>Please present this confirmation email or download your digital QR ticket from the dashboard when checking in at the venue entrance.</p>
              
              <div style="text-align: center;">
                <a href="${env.APP_URL}/dashboard/events" class="btn">View Event in Dashboard</a>
              </div>
            </div>
            <div class="card footer">
              &copy; ${new Date().getFullYear()} WeVentureHub Ltd. All Rights Reserved. Co-working & Event Incubation Center.
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generates a beautifully-styled enterprise HTML template for Workspace Bookings
   */
  public getBookingConfirmationTemplate(params: {
    userName: string;
    spaceName: string;
    startTime: string;
    endTime: string;
    totalAmount: string;
    bookingId: string;
  }): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Inter', system-ui, sans-serif; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 20px; }
            .card { max-width: 600px; margin: 0 auto; background: white; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); }
            .header { background: #10b981; padding: 24px; text-align: center; color: white; }
            .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.025em; }
            .content { padding: 24px; line-height: 1.6; }
            .meta-box { background: #f1f5f9; border-radius: 12px; padding: 16px; margin: 20px 0; border: 1px solid #e2e8f0; }
            .meta-item { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
            .meta-item:last-child { margin-bottom: 0; border-top: 1px dashed #cbd5e1; pt-8px; margin-top: 8px; font-weight: bold; }
            .footer { background: #f8fafc; padding: 16px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }
            .btn { display: inline-block; padding: 10px 20px; background: #10b981; color: white !important; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 13px; margin-top: 12px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <h1>Workspace Reservation Verified</h1>
            </div>
            <div class="content">
              <p>Hello <strong>${params.userName}</strong>,</p>
              <p>Your workspace reservation has been successfully booked and confirmed. Your session parameters are documented below:</p>
              
              <div class="meta-box">
                <div class="meta-item"><span>Reservation ID</span> <strong>${params.bookingId}</strong></div>
                <div class="meta-item"><span>Reserved Space</span> <strong>${params.spaceName}</strong></div>
                <div class="meta-item"><span>Start Date/Time</span> <span>${params.startTime}</span></div>
                <div class="meta-item"><span>End Date/Time</span> <span>${params.endTime}</span></div>
                <div class="meta-item"><span>Charged Total</span> <strong>${params.totalAmount}</strong></div>
              </div>
              
              <p>If you need to make any adjustments, cancel your reservation, or add custom catering/amenities, navigate to the WeVentureHub portal bookings tab.</p>
              
              <div style="text-align: center;">
                <a href="${env.APP_URL}/dashboard/bookings" class="btn">Manage Your Bookings</a>
              </div>
            </div>
            <div class="card footer">
              &copy; ${new Date().getFullYear()} WeVentureHub Ltd. All Rights Reserved. Co-working & Event Incubation Center.
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generates HTML template for general system alerts / global announcements
   */
  public getAnnouncementTemplate(params: {
    title: string;
    content: string;
  }): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Inter', system-ui, sans-serif; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 20px; }
            .card { max-width: 600px; margin: 0 auto; background: white; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); }
            .header { background: #6366f1; padding: 24px; text-align: center; color: white; }
            .header h1 { margin: 0; font-size: 20px; font-weight: 800; }
            .content { padding: 24px; line-height: 1.6; font-size: 14px; }
            .footer { background: #f8fafc; padding: 16px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }
            .btn { display: inline-block; padding: 10px 20px; background: #6366f1; color: white !important; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 13px; margin-top: 12px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <h1>${params.title}</h1>
            </div>
            <div class="content">
              <p>${params.content.replace(/\n/g, '<br>')}</p>
              
              <div style="text-align: center;">
                <a href="${env.APP_URL}/dashboard" class="btn">Open WeVentureHub</a>
              </div>
            </div>
            <div class="card footer">
              You are receiving this notification because you are a registered member of WeVentureHub.<br>
              &copy; ${new Date().getFullYear()} WeVentureHub Ltd. Co-working Hub.
            </div>
          </div>
        </body>
      </html>
    `;
  }
  /**
   * Generates a beautifully-styled HTML template for Pending Approval registrations
   */
  public getPendingApprovalTemplate(params: {
    userName: string;
    eventTitle: string;
    ticketNumber: string;
    dateRange: string;
    location: string;
  }): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Inter', system-ui, sans-serif; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 20px; }
            .card { max-width: 600px; margin: 0 auto; background: white; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); }
            .header { background: #eab308; padding: 24px; text-align: center; color: white; }
            .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.025em; }
            .content { padding: 24px; line-height: 1.6; }
            .meta-box { background: #f1f5f9; border-radius: 12px; padding: 16px; margin: 20px 0; border: 1px solid #e2e8f0; }
            .meta-item { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
            .meta-item:last-child { margin-bottom: 0; border-top: 1px dashed #cbd5e1; pt-8px; margin-top: 8px; font-weight: bold; }
            .footer { background: #f8fafc; padding: 16px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <h1>Registration Pending Approval</h1>
            </div>
            <div class="content">
              <p>Hello <strong>${params.userName}</strong>,</p>
              <p>We have received your registration for <strong>${params.eventTitle}</strong>. Since this event requires organizer approval, your ticket is currently in a <strong>pending approval queue</strong>.</p>
              
              <div class="meta-box">
                <div class="meta-item"><span>Pending Ticket</span> <strong>${params.ticketNumber}</strong></div>
                <div class="meta-item"><span>Event Title</span> <strong>${params.eventTitle}</strong></div>
                <div class="meta-item"><span>Date / Time</span> <span>${params.dateRange}</span></div>
                <div class="meta-item"><span>Location</span> <span>${params.location}</span></div>
              </div>
              
              <p>The organizing team will review your application shortly. Once approved, you will receive your official admission ticket with QR code validation via email.</p>
            </div>
            <div class="card footer">
              &copy; ${new Date().getFullYear()} WeVentureHub Ltd. All Rights Reserved. Co-working & Event Incubation Center.
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generates a beautifully-styled HTML template for Rejected registrations
   */
  public getApprovalRejectedTemplate(params: {
    userName: string;
    eventTitle: string;
    ticketNumber: string;
  }): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Inter', system-ui, sans-serif; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 20px; }
            .card { max-width: 600px; margin: 0 auto; background: white; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); }
            .header { background: #ef4444; padding: 24px; text-align: center; color: white; }
            .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.025em; }
            .content { padding: 24px; line-height: 1.6; }
            .footer { background: #f8fafc; padding: 16px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <h1>Registration Update</h1>
            </div>
            <div class="content">
              <p>Hello <strong>${params.userName}</strong>,</p>
              <p>Thank you for your interest in <strong>${params.eventTitle}</strong>.</p>
              <p>Unfortunately, the organizing team was unable to approve your registration request for this specific session. Your pending application with reference ID <strong>${params.ticketNumber}</strong> has been cancelled.</p>
              <p>Please browse other available events on the platform or reach out to our support channel if you have any questions.</p>
            </div>
            <div class="card footer">
              &copy; ${new Date().getFullYear()} WeVentureHub Ltd. All Rights Reserved. Co-working & Event Incubation Center.
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generates a beautifully-styled HTML template for Event Invitations
   */
  public getEventInvitationTemplate(params: {
    userName: string;
    eventTitle: string;
    invitationUrl: string;
  }): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Inter', system-ui, sans-serif; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 20px; }
            .card { max-width: 600px; margin: 0 auto; background: white; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); }
            .header { background: #6366f1; padding: 24px; text-align: center; color: white; }
            .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.025em; }
            .content { padding: 24px; line-height: 1.6; }
            .footer { background: #f8fafc; padding: 16px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }
            .btn { display: inline-block; padding: 12px 24px; background: #6366f1; color: white !important; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; margin-top: 16px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <h1>Exclusive Event Invitation</h1>
            </div>
            <div class="content">
              <p>Hello <strong>${params.userName}</strong>,</p>
              <p>You have been exclusively invited to register for the upcoming private event: <strong>${params.eventTitle}</strong>.</p>
              <p>This session is invite-only, and your spot has been pre-reserved under your email. Click the link below to view details and complete your registration form:</p>
              
              <div style="text-align: center; margin: 24px 0;">
                <a href="${params.invitationUrl}" class="btn">Register Now</a>
              </div>
              
              <p>We look forward to hosting you!</p>
            </div>
            <div class="card footer">
              &copy; ${new Date().getFullYear()} WeVentureHub Ltd. All Rights Reserved. Co-working & Event Incubation Center.
            </div>
          </div>
        </body>
      </html>
    `;
  }
}

export const emailService = new EmailService();
