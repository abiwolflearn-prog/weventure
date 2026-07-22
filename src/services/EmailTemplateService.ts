import { EmailTemplate, IEmailBranding } from '../models/EmailTemplate';
import { logger } from '../utils/logger';

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export const DEFAULT_BRANDING: IEmailBranding = {
  logoUrl: 'https://weventurehub.com/assets/logo.png',
  headerBgColor: '#0f172a', // Slate 900
  primaryColor: '#3b82f6', // Brand Blue
  buttonBgColor: '#3b82f6',
  buttonTextColor: '#ffffff',
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  companyName: 'WeVentureHub',
  companyAddress: 'Airport Road, Sur Construction second floor, Addis Ababa',
  supportEmail: 'info@weventurehub.com',
  supportPhone: '091 124 3503',
  footerText: 'You are receiving this automated email as a valued member, workspace client, or community partner of WeVentureHub.',
  signatureText: 'Warm regards,\nThe WeVentureHub Operations Team',
};

class EmailTemplateService {
  /**
   * Wrap content in master WeVentureHub branded HTML container
   */
  public wrapInMasterLayout(contentHtml: string, branding: IEmailBranding = DEFAULT_BRANDING, title: string = 'WeVentureHub Notification'): string {
    const b = { ...DEFAULT_BRANDING, ...branding };
    const currentYear = new Date().getFullYear();

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      font-family: ${b.fontFamily};
      color: #1e293b;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f8fafc;
      padding: 32px 12px;
      box-sizing: border-box;
    }
    .container {
      max-width: 620px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.05), 0 8px 10px -6px rgba(15, 23, 42, 0.01);
    }
    .header {
      background-color: ${b.headerBgColor};
      padding: 28px 32px;
      text-align: center;
      border-bottom: 3px solid ${b.primaryColor};
    }
    .logo-text {
      color: #ffffff;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.03em;
      text-decoration: none;
      display: inline-block;
    }
    .logo-badge {
      color: ${b.primaryColor};
    }
    .header-subtitle {
      color: #94a3b8;
      font-size: 12px;
      font-weight: 500;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      margin-top: 6px;
    }
    .content {
      padding: 32px;
      line-height: 1.65;
      font-size: 15px;
      color: #334155;
    }
    h1, h2, h3 {
      color: #0f172a;
      margin-top: 0;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .highlight-card {
      background-color: #f1f5f9;
      border-left: 4px solid ${b.primaryColor};
      border-radius: 8px;
      padding: 18px 20px;
      margin: 22px 0;
    }
    .meta-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 14px;
    }
    .meta-table td {
      padding: 10px 12px;
      border-bottom: 1px solid #e2e8f0;
    }
    .meta-table tr:last-child td {
      border-bottom: none;
    }
    .meta-label {
      color: #64748b;
      font-weight: 500;
      width: 40%;
    }
    .meta-value {
      color: #0f172a;
      font-weight: 600;
      text-align: right;
    }
    .btn-container {
      text-align: center;
      margin: 30px 0;
    }
    .btn {
      display: inline-block;
      background-color: ${b.buttonBgColor};
      color: ${b.buttonTextColor} !important;
      text-decoration: none;
      font-weight: 600;
      font-size: 15px;
      padding: 14px 28px;
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
      transition: all 0.2s ease;
    }
    .footer {
      background-color: #f8fafc;
      padding: 24px 32px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      font-size: 12px;
      color: #64748b;
      line-height: 1.6;
    }
    .footer-links a {
      color: ${b.primaryColor};
      text-decoration: none;
      margin: 0 8px;
    }
    .divider {
      height: 1px;
      background-color: #e2e8f0;
      margin: 24px 0;
    }
    .signature {
      margin-top: 24px;
      font-style: normal;
      color: #475569;
      font-weight: 500;
    }
    @media only screen and (max-width: 600px) {
      .content { padding: 20px 16px; }
      .header { padding: 20px 16px; }
      .footer { padding: 20px 16px; }
      .btn { width: 100%; box-sizing: border-box; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <!-- Header -->
      <div class="header">
        <a href="https://weventurehub.com" class="logo-text">
          WeVenture<span class="logo-badge">Hub</span>
        </a>
        <div class="header-subtitle">Innovation & Co-Working Community</div>
      </div>

      <!-- Main Body Content -->
      <div class="content">
        ${contentHtml}
        
        <div class="signature">
          ${(b.signatureText || DEFAULT_BRANDING.signatureText!).replace(/\n/g, '<br>')}
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <p style="margin-bottom: 8px;"><strong>${b.companyName}</strong> • ${b.companyAddress}</p>
        <p style="margin-bottom: 12px;">Need help? Contact <a href="mailto:${b.supportEmail}" style="color:${b.primaryColor};">${b.supportEmail}</a> or call ${b.supportPhone}</p>
        <p class="footer-links">
          <a href="https://weventurehub.com/dashboard">My Dashboard</a> • 
          <a href="https://weventurehub.com/workspaces">Book Workspaces</a> • 
          <a href="https://weventurehub.com/events">Events</a>
        </p>
        <div class="divider"></div>
        <p style="font-size: 11px; color: #94a3b8; margin: 0;">
          ${b.footerText}<br>
          &copy; ${currentYear} ${b.companyName}. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Helper to replace {{varName}} with data
   */
  public interpolate(templateStr: string, data: Record<string, any>): string {
    return templateStr.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_, key) => {
      const keys = key.split('.');
      let val: any = data;
      for (const k of keys) {
        if (val && typeof val === 'object' && k in val) {
          val = val[k];
        } else {
          return '';
        }
      }
      return val !== undefined && val !== null ? String(val) : '';
    });
  }

  /**
   * Render complete email template by key with provided variables
   */
  public async renderTemplate(templateKey: string, variables: Record<string, any>): Promise<RenderedEmail> {
    try {
      let dbTemplate = await (EmailTemplate as any).findOne({ templateKey, active: true }).lean();

      let subject = '';
      let rawContentHtml = '';
      let branding = DEFAULT_BRANDING;

      if (dbTemplate) {
        subject = dbTemplate.subject;
        rawContentHtml = dbTemplate.bodyHtml;
        if (dbTemplate.branding) {
          branding = { ...DEFAULT_BRANDING, ...dbTemplate.branding };
        }
      } else {
        // Fallback to built-in system templates
        const defaultTmpl = BUILT_IN_TEMPLATES[templateKey];
        if (defaultTmpl) {
          subject = defaultTmpl.subject;
          rawContentHtml = defaultTmpl.bodyHtml;
        } else {
          logger.warn(`⚠️ Template key "${templateKey}" not found in DB or built-in registry. Generating fallback.`);
          subject = variables.subject || 'WeVentureHub Notification';
          rawContentHtml = `<p>Hello <strong>${variables.userName || 'Member'}</strong>,</p><p>${variables.message || 'You have a new update from WeVentureHub.'}</p>`;
        }
      }

      const interpolatedSubject = this.interpolate(subject, variables);
      const interpolatedBody = this.interpolate(rawContentHtml, variables);
      const fullHtml = this.wrapInMasterLayout(interpolatedBody, branding, interpolatedSubject);
      const plainText = interpolatedBody.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

      return {
        subject: interpolatedSubject,
        html: fullHtml,
        text: plainText,
      };
    } catch (error) {
      logger.error(`❌ Error rendering email template "${templateKey}":`, error);
      const fallbackSubject = variables.subject || 'WeVentureHub Update';
      const fallbackBody = `<p>Hello ${variables.userName || 'Member'},</p><p>${variables.message || 'Thank you for using WeVentureHub.'}</p>`;
      return {
        subject: fallbackSubject,
        html: this.wrapInMasterLayout(fallbackBody, DEFAULT_BRANDING, fallbackSubject),
        text: fallbackBody.replace(/<[^>]+>/g, ' '),
      };
    }
  }

  /**
   * Seed default templates if database is empty
   */
  public async seedDefaultTemplates(): Promise<void> {
    try {
      const count = await EmailTemplate.countDocuments();
      if (count === 0) {
        logger.info('🌱 Seeding initial WeVentureHub Email Templates into database...');
        const templatesToInsert = Object.entries(BUILT_IN_TEMPLATES).map(([key, item]) => ({
          tenantId: 'weventurehub',
          templateKey: key,
          name: item.name,
          category: item.category,
          subject: item.subject,
          bodyHtml: item.bodyHtml,
          branding: DEFAULT_BRANDING,
          isSystem: true,
          active: true,
        }));

        await (EmailTemplate as any).insertMany(templatesToInsert);
        logger.info(`✅ Successfully seeded ${templatesToInsert.length} default email templates.`);
      }
    } catch (error) {
      logger.error('❌ Failed to seed default email templates:', error);
    }
  }
}

// Built-in Enterprise Templates Registry
export const BUILT_IN_TEMPLATES: Record<string, { name: string; category: any; subject: string; bodyHtml: string }> = {
  // 1. AUTHENTICATION
  welcome_email: {
    name: 'Welcome Email',
    category: 'auth',
    subject: 'Welcome to WeVentureHub, {{userName}}! 🚀',
    bodyHtml: `
      <h2>Welcome to the WeVentureHub Community!</h2>
      <p>Hello <strong>{{userName}}</strong>,</p>
      <p>We are thrilled to welcome you to <strong>WeVentureHub</strong> — Ethiopia's premier co-working, innovation, and startup growth hub.</p>
      <div class="highlight-card">
        <p style="margin:0; font-weight: 600; color: #0f172a;">What you can do on your member platform:</p>
        <ul style="margin: 10px 0 0 20px; padding: 0;">
          <li>Book hot desks, dedicated desks, and high-tech meeting rooms</li>
          <li>Register for upcoming startup workshops, pitch nights & hackathons</li>
          <li>Access digital agreements, billing statements, and instant invoice receipts</li>
          <li>Connect with our community manager and AI Assistant 24/7</li>
        </ul>
      </div>
      <div class="btn-container">
        <a href="{{loginUrl}}" class="btn">Log In to Your Dashboard</a>
      </div>
      <p>If you have any questions or need assistance setting up your workspace plan, our team is always here to help.</p>
    `,
  },
  email_verification: {
    name: 'Email Verification / OTP',
    category: 'auth',
    subject: 'Verify Your Email Address - WeVentureHub',
    bodyHtml: `
      <h2>Verify Your WeVentureHub Account</h2>
      <p>Hello <strong>{{userName}}</strong>,</p>
      <p>Thank you for creating an account with WeVentureHub. To complete your activation, please use the verification code below or click the verification link:</p>
      <div class="highlight-card" style="text-align: center; padding: 24px;">
        <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #3b82f6;">{{otpCode}}</span>
        <p style="margin-top: 8px; font-size: 13px; color: #64748b;">This verification code expires in {{expiryMinutes}} minutes.</p>
      </div>
      <div class="btn-container">
        <a href="{{verifyUrl}}" class="btn">Verify Email Address</a>
      </div>
      <p style="font-size: 13px; color: #64748b;">If you did not request this registration, please disregard this message.</p>
    `,
  },
  password_reset: {
    name: 'Password Reset Request',
    category: 'auth',
    subject: 'Reset Your WeVentureHub Password',
    bodyHtml: `
      <h2>Password Reset Instruction</h2>
      <p>Hello <strong>{{userName}}</strong>,</p>
      <p>We received a request to reset your password for your WeVentureHub account (<strong>{{userEmail}}</strong>).</p>
      <p>Click the secure link below to choose a new password. For security purposes, this link will expire in <strong>{{expiryMinutes}} minutes</strong>.</p>
      <div class="btn-container">
        <a href="{{resetUrl}}" class="btn">Reset My Password</a>
      </div>
      <div class="highlight-card" style="border-left-color: #ef4444; background-color: #fef2f2;">
        <strong style="color: #991b1b;">Security Alert:</strong> If you did not request a password reset, your credentials remain safe. Do not click the button and notify security at support@weventurehub.com immediately.
      </div>
    `,
  },

  // 2. WORKSPACE BOOKINGS
  booking_received_customer: {
    name: 'Workspace Booking Received (Customer)',
    category: 'booking',
    subject: 'Booking Received: {{spaceName}} (#{{bookingId}})',
    bodyHtml: `
      <h2>Workspace Booking Confirmation Received</h2>
      <p>Hello <strong>{{userName}}</strong>,</p>
      <p>Thank you for submitting your workspace reservation at WeVentureHub. We have received your booking request and it is currently being reviewed by our operations staff.</p>
      <table class="meta-table">
        <tr><td class="meta-label">Booking Reference</td><td class="meta-value">#{{bookingId}}</td></tr>
        <tr><td class="meta-label">Reserved Workspace</td><td class="meta-value">{{spaceName}}</td></tr>
        <tr><td class="meta-label">Start Date & Time</td><td class="meta-value">{{startTime}}</td></tr>
        <tr><td class="meta-label">End Date & Time</td><td class="meta-value">{{endTime}}</td></tr>
        <tr><td class="meta-label">Total Amount</td><td class="meta-value">{{totalAmount}}</td></tr>
        <tr><td class="meta-label">Status</td><td class="meta-value" style="color:#d97706; font-weight: bold;">Pending Review</td></tr>
      </table>
      <p>You will receive another update as soon as your booking is reviewed and approved by reception.</p>
      <div class="btn-container">
        <a href="{{bookingUrl}}" class="btn">View Booking Details</a>
      </div>
    `,
  },
  booking_received_admin: {
    name: 'New Workspace Booking (Admin Notification)',
    category: 'booking',
    subject: '⚡ Action Required: New Booking Request #{{bookingId}}',
    bodyHtml: `
      <h2>New Workspace Reservation Submitted</h2>
      <p>A new workspace reservation request requires operational review and approval.</p>
      <table class="meta-table">
        <tr><td class="meta-label">Customer Name</td><td class="meta-value">{{userName}} ({{userEmail}})</td></tr>
        <tr><td class="meta-label">Booking ID</td><td class="meta-value">#{{bookingId}}</td></tr>
        <tr><td class="meta-label">Workspace</td><td class="meta-value">{{spaceName}}</td></tr>
        <tr><td class="meta-label">Schedule</td><td class="meta-value">{{startTime}} - {{endTime}}</td></tr>
        <tr><td class="meta-label">Amount</td><td class="meta-value">{{totalAmount}}</td></tr>
      </table>
      <div class="btn-container">
        <a href="{{adminApproveUrl}}" class="btn" style="background-color: #10b981;">Review & Approve Booking</a>
      </div>
    `,
  },
  booking_approved: {
    name: 'Workspace Booking Approved',
    category: 'booking',
    subject: '🎉 Booking Approved: {{spaceName}} (#{{bookingId}})',
    bodyHtml: `
      <h2 style="color: #10b981;">Workspace Reservation Approved!</h2>
      <p>Hello <strong>{{userName}}</strong>,</p>
      <p>Great news! Your workspace booking for <strong>{{spaceName}}</strong> has been officially approved and verified by WeVentureHub reception.</p>
      <table class="meta-table">
        <tr><td class="meta-label">Reservation Ref</td><td class="meta-value">#{{bookingId}}</td></tr>
        <tr><td class="meta-label">Workspace</td><td class="meta-value">{{spaceName}}</td></tr>
        <tr><td class="meta-label">Start Date</td><td class="meta-value">{{startTime}}</td></tr>
        <tr><td class="meta-label">End Date</td><td class="meta-value">{{endTime}}</td></tr>
        <tr><td class="meta-label">Agreement #</td><td class="meta-value">{{agreementNumber}}</td></tr>
        <tr><td class="meta-label">Payment Status</td><td class="meta-value" style="color: #10b981; font-weight: bold;">{{paymentStatus}}</td></tr>
      </table>
      <div class="highlight-card">
        <strong style="color: #0f172a;">Next Steps for Arrival:</strong>
        <p style="margin: 6px 0 0 0; font-size: 14px;">Present your digital badge or reference number #{{bookingId}} to front desk reception upon arrival. Complimentary high-speed Wi-Fi credentials and barista coffee amenities will be available.</p>
      </div>
      <div class="btn-container">
        <a href="{{bookingUrl}}" class="btn">View Reservation & Check-in Badge</a>
      </div>
    `,
  },
  booking_rejected: {
    name: 'Workspace Booking Rejected',
    category: 'booking',
    subject: 'Update Regarding Booking Request #{{bookingId}}',
    bodyHtml: `
      <h2>Booking Request Update</h2>
      <p>Hello <strong>{{userName}}</strong>,</p>
      <p>We regret to inform you that your workspace reservation request #<strong>{{bookingId}}</strong> for <strong>{{spaceName}}</strong> could not be fulfilled at this time.</p>
      <div class="highlight-card" style="border-left-color: #ef4444; background-color: #fef2f2;">
        <strong style="color: #991b1b;">Reason for Rejection:</strong>
        <p style="margin: 4px 0 0 0; color: #7f1d1d;">{{reason}}</p>
      </div>
      <p>Our team would be happy to assist you in selecting alternative available dates or equivalent meeting rooms.</p>
      <div class="btn-container">
        <a href="{{exploreUrl}}" class="btn">Browse Other Available Spaces</a>
      </div>
    `,
  },

  // 3. AGREEMENTS & INVOICES
  agreement_generated: {
    name: 'Workspace Digital Agreement',
    category: 'renewal',
    subject: 'WeVentureHub Digital Workspace Agreement #{{agreementNumber}}',
    bodyHtml: `
      <h2>Your Workspace Agreement is Ready</h2>
      <p>Hello <strong>{{userName}}</strong>,</p>
      <p>Your official WeVentureHub Workspace Membership & Terms Agreement <strong>#{{agreementNumber}}</strong> has been generated and is ready for your signature/download.</p>
      <table class="meta-table">
        <tr><td class="meta-label">Agreement Ref</td><td class="meta-value">#{{agreementNumber}}</td></tr>
        <tr><td class="meta-label">Assigned Workspace</td><td class="meta-value">{{spaceName}}</td></tr>
        <tr><td class="meta-label">Effective Duration</td><td class="meta-value">{{startDate}} to {{endDate}}</td></tr>
        <tr><td class="meta-label">Payment Schedule</td><td class="meta-value">{{paymentSchedule}}</td></tr>
      </table>
      <div class="btn-container">
        <a href="{{downloadUrl}}" class="btn">Download & Sign Agreement PDF</a>
      </div>
      <p style="font-size: 13px; color: #64748b;">Please review the terms and complete your digital signature prior to your workspace occupancy start date.</p>
    `,
  },
  invoice_generated: {
    name: 'Invoice Generated',
    category: 'invoice',
    subject: 'Invoice #{{invoiceNumber}} Generated - WeVentureHub',
    bodyHtml: `
      <h2>New Statement of Account / Invoice</h2>
      <p>Hello <strong>{{userName}}</strong>,</p>
      <p>A new invoice <strong>#{{invoiceNumber}}</strong> has been issued for your WeVentureHub services.</p>
      <table class="meta-table">
        <tr><td class="meta-label">Invoice Number</td><td class="meta-value">#{{invoiceNumber}}</td></tr>
        <tr><td class="meta-label">Billing Period</td><td class="meta-value">{{billingPeriod}}</td></tr>
        <tr><td class="meta-label">Due Date</td><td class="meta-value" style="color: #d97706; font-weight: bold;">{{dueDate}}</td></tr>
        <tr><td class="meta-label">Total Amount</td><td class="meta-value">{{amount}} {{currency}}</td></tr>
        <tr><td class="meta-label">Balance Outstanding</td><td class="meta-value" style="color: #ef4444; font-weight: bold;">{{balance}} {{currency}}</td></tr>
      </table>
      <div class="btn-container">
        <a href="{{paymentUrl}}" class="btn" style="background-color: #10b981;">Pay Invoice Online Now</a>
      </div>
      <div style="text-align: center; margin-top: 10px;">
        <a href="{{downloadUrl}}" style="color: #3b82f6; font-size: 13px; text-decoration: underline;">Download PDF Invoice</a>
      </div>
    `,
  },
  payment_reminder: {
    name: 'Automatic Payment Reminder',
    category: 'invoice',
    subject: '{{reminderHeader}}: Invoice #{{invoiceNumber}}',
    bodyHtml: `
      <h2>{{reminderHeader}}</h2>
      <p>Hello <strong>{{userName}}</strong>,</p>
      <p>This is a friendly reminder regarding outstanding Invoice <strong>#{{invoiceNumber}}</strong> for your WeVentureHub membership/space.</p>
      <div class="highlight-card" style="border-left-color: {{statusColor}};">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="color:#64748b; font-size:13px;">Invoice Ref:</td><td style="text-align:right; font-weight:bold;">#{{invoiceNumber}}</td></tr>
          <tr><td style="color:#64748b; font-size:13px;">Amount Due:</td><td style="text-align:right; font-weight:bold; color: #0f172a;">{{amount}} {{currency}}</td></tr>
          <tr><td style="color:#64748b; font-size:13px;">Due Date:</td><td style="text-align:right; font-weight:bold; color: {{statusColor}};">{{dueDate}}</td></tr>
        </table>
      </div>
      <p>To keep your account current and avoid any interruption to your workspace access or high-speed internet, please settle your invoice below:</p>
      <div class="btn-container">
        <a href="{{paymentUrl}}" class="btn" style="background-color: {{statusColor}};">Pay Now Online</a>
      </div>
    `,
  },
  payment_success_customer: {
    name: 'Payment Receipt (Customer)',
    category: 'invoice',
    subject: 'Payment Receipt: Invoice #{{invoiceNumber}} Paid Successfully',
    bodyHtml: `
      <h2 style="color: #10b981;">Payment Received — Thank You!</h2>
      <p>Hello <strong>{{userName}}</strong>,</p>
      <p>We have successfully verified and received your payment via ArifPay / Bank Transfer. Here is your official payment receipt statement:</p>
      <table class="meta-table">
        <tr><td class="meta-label">Transaction Ref</td><td class="meta-value">{{transactionRef}}</td></tr>
        <tr><td class="meta-label">Invoice Paid</td><td class="meta-value">#{{invoiceNumber}}</td></tr>
        <tr><td class="meta-label">Amount Paid</td><td class="meta-value" style="color: #10b981; font-weight: bold;">{{amount}} {{currency}}</td></tr>
        <tr><td class="meta-label">Payment Method</td><td class="meta-value">{{paymentMethod}}</td></tr>
        <tr><td class="meta-label">Payment Date</td><td class="meta-value">{{paymentDate}}</td></tr>
      </table>
      <div class="btn-container">
        <a href="{{receiptUrl}}" class="btn">View & Download Official Receipt PDF</a>
      </div>
    `,
  },
  payment_failed: {
    name: 'Payment Transaction Failed',
    category: 'invoice',
    subject: '⚠️ Payment Unsuccessful for Invoice #{{invoiceNumber}}',
    bodyHtml: `
      <h2>Payment Processing Notice</h2>
      <p>Hello <strong>{{userName}}</strong>,</p>
      <p>We attempted to process your payment for Invoice <strong>#{{invoiceNumber}}</strong>, but the transaction was unsuccessful.</p>
      <div class="highlight-card" style="border-left-color: #ef4444; background-color: #fef2f2;">
        <strong style="color: #991b1b;">Failure Details:</strong>
        <p style="margin: 4px 0 0 0; color: #7f1d1d;">{{reason}}</p>
      </div>
      <p>No charges were permanently finalized. Please retry your payment online using an alternative payment method or contact accounting.</p>
      <div class="btn-container">
        <a href="{{paymentUrl}}" class="btn" style="background-color: #ef4444;">Retry Payment Now</a>
      </div>
    `,
  },

  // 4. RENEWALS & EVENTS
  workspace_renewal: {
    name: 'Workspace Renewal Notice',
    category: 'renewal',
    subject: 'Workspace Plan Renewal Notice: {{daysRemaining}} Days Remaining',
    bodyHtml: `
      <h2>Workspace Renewal Notice</h2>
      <p>Hello <strong>{{userName}}</strong>,</p>
      <p>Your workspace agreement for <strong>{{spaceName}}</strong> is set to expire in <strong>{{daysRemaining}} days</strong> (Expiry Date: <strong>{{expiryDate}}</strong>).</p>
      <p>To lock in your dedicated space and maintain uninterrupted access to our high-speed network and amenities, renew your contract today:</p>
      <table class="meta-table">
        <tr><td class="meta-label">Current Agreement</td><td class="meta-value">#{{agreementNumber}}</td></tr>
        <tr><td class="meta-label">Assigned Space</td><td class="meta-value">{{spaceName}}</td></tr>
        <tr><td class="meta-label">Renewal Rate</td><td class="meta-value">{{renewalPrice}}</td></tr>
      </table>
      <div class="btn-container">
        <a href="{{renewUrl}}" class="btn" style="background-color: #10b981;">Renew Workspace Agreement</a>
      </div>
    `,
  },
  agreement_expired: {
    name: 'Agreement Expired Notice',
    category: 'renewal',
    subject: 'Agreement #{{agreementNumber}} Has Expired - WeVentureHub',
    bodyHtml: `
      <h2>Workspace Agreement Expired</h2>
      <p>Hello <strong>{{userName}}</strong>,</p>
      <p>Your workspace agreement <strong>#{{agreementNumber}}</strong> for <strong>{{spaceName}}</strong> expired on <strong>{{expiryDate}}</strong>.</p>
      <p>If you wish to continue utilizing our co-working facilities or transition to a flexible hot desk plan, you can reactivate your account anytime.</p>
      <div class="btn-container">
        <a href="{{renewUrl}}" class="btn">Reactivate & Renew Membership</a>
      </div>
    `,
  },
  event_registration_confirmation: {
    name: 'Event Registration Confirmed',
    category: 'event',
    subject: 'Ticket Confirmed: {{eventTitle}}',
    bodyHtml: `
      <h2>Event Admission Ticket Confirmed!</h2>
      <p>Hello <strong>{{userName}}</strong>,</p>
      <p>Your registration for <strong>{{eventTitle}}</strong> at WeVentureHub has been verified!</p>
      <table class="meta-table">
        <tr><td class="meta-label">Ticket Ref</td><td class="meta-value">#{{ticketNumber}}</td></tr>
        <tr><td class="meta-label">Event Name</td><td class="meta-value">{{eventTitle}}</td></tr>
        <tr><td class="meta-label">Date & Time</td><td class="meta-value">{{dateRange}}</td></tr>
        <tr><td class="meta-label">Venue Location</td><td class="meta-value">{{location}}</td></tr>
        <tr><td class="meta-label">Organizer</td><td class="meta-value">{{organizerName}}</td></tr>
      </table>
      <div class="btn-container">
        <a href="{{ticketUrl}}" class="btn">View & Download QR Pass</a>
      </div>
    `,
  },
  event_reminder: {
    name: 'Upcoming Event Reminder',
    category: 'event',
    subject: '⏰ Reminder: {{eventTitle}} Starts Soon! ({{timeRemaining}})',
    bodyHtml: `
      <h2>Event Starting Soon</h2>
      <p>Hello <strong>{{userName}}</strong>,</p>
      <p>This is a quick reminder that <strong>{{eventTitle}}</strong> is starting in <strong>{{timeRemaining}}</strong>!</p>
      <div class="highlight-card">
        <p style="margin: 0; font-weight: bold; color: #0f172a;">Event Check-In Summary:</p>
        <p style="margin: 6px 0 0 0; font-size: 14px;">📍 Venue: {{location}}<br>🕒 Time: {{dateRange}}<br>👤 Host Contact: {{organizerName}}</p>
      </div>
      <div class="btn-container">
        <a href="{{mapsUrl}}" class="btn" style="background-color: #6366f1;">Open Google Maps Direction</a>
      </div>
    `,
  },

  // 5. CONTACT & AI ESCALATION & ADMIN
  contact_form_admin: {
    name: 'New Contact Form Submission',
    category: 'support',
    subject: '📬 New Website Contact Inquiry from {{customerName}}',
    bodyHtml: `
      <h2>New Public Contact Form Submission</h2>
      <p>A new contact request was submitted through the WeVentureHub public portal:</p>
      <table class="meta-table">
        <tr><td class="meta-label">Sender Name</td><td class="meta-value">{{customerName}}</td></tr>
        <tr><td class="meta-label">Sender Email</td><td class="meta-value">{{customerEmail}}</td></tr>
        <tr><td class="meta-label">Phone</td><td class="meta-value">{{customerPhone}}</td></tr>
        <tr><td class="meta-label">Subject</td><td class="meta-value">{{subject}}</td></tr>
      </table>
      <div class="highlight-card">
        <strong style="color: #0f172a;">Message Content:</strong>
        <p style="margin: 6px 0 0 0; color: #334155;">{{messageContent}}</p>
      </div>
      <div class="btn-container">
        <a href="mailto:{{customerEmail}}" class="btn">Reply Directly via Email</a>
      </div>
    `,
  },
  contact_form_customer: {
    name: 'Contact Form Thank You Confirmation',
    category: 'support',
    subject: 'We Received Your Message — WeVentureHub',
    bodyHtml: `
      <h2>Thank You for Reaching Out!</h2>
      <p>Hello <strong>{{customerName}}</strong>,</p>
      <p>Thank you for contacting WeVentureHub. We have received your inquiry regarding <strong>"{{subject}}"</strong>.</p>
      <p>Our community management and reception team will review your message and respond within 24 business hours.</p>
    `,
  },
  ai_chatbot_escalation_admin: {
    name: 'AI Chatbot Support Handoff Alert',
    category: 'support',
    subject: '🆘 Support Ticket Escalated #{{ticketNumber}}',
    bodyHtml: `
      <h2 style="color: #ef4444;">AI Assistant Support Escalation</h2>
      <p>A customer requested human operator assistance via the WeVentureHub AI Assistant:</p>
      <table class="meta-table">
        <tr><td class="meta-label">Ticket ID</td><td class="meta-value">#{{ticketNumber}}</td></tr>
        <tr><td class="meta-label">Customer</td><td class="meta-value">{{customerName}} ({{customerEmail}})</td></tr>
        <tr><td class="meta-label">Topic / Subject</td><td class="meta-value">{{subject}}</td></tr>
      </table>
      <div class="highlight-card">
        <strong style="color: #0f172a;">Inquiry Summary:</strong>
        <p style="margin: 6px 0 0 0; color: #334155;">{{userInquiry}}</p>
      </div>
      <div class="btn-container">
        <a href="{{ticketUrl}}" class="btn" style="background-color: #ef4444;">Respond in Support Dashboard</a>
      </div>
    `,
  },
  ai_chatbot_escalation_customer: {
    name: 'Support Request Received (Customer)',
    category: 'support',
    subject: 'Support Request Received #{{ticketNumber}}',
    bodyHtml: `
      <h2>Support Ticket Created</h2>
      <p>Hello <strong>{{customerName}}</strong>,</p>
      <p>Your request for human support has been received and converted into Support Ticket <strong>#{{ticketNumber}}</strong>.</p>
      <p>Our reception & community team has been notified and will follow up with you shortly.</p>
      <div class="btn-container">
        <a href="{{ticketUrl}}" class="btn">Track Ticket Status</a>
      </div>
    `,
  },
  admin_notification_generic: {
    name: 'System Admin Event Notification',
    category: 'admin',
    subject: '🔔 WeVentureHub Admin Alert: {{eventTitle}}',
    bodyHtml: `
      <h2>{{eventTitle}}</h2>
      <p>An automated system notification was triggered:</p>
      <div class="highlight-card">
        <p style="margin: 0; color: #0f172a; font-weight: 500;">{{message}}</p>
      </div>
      <div class="btn-container">
        <a href="{{adminUrl}}" class="btn">Open Admin Console</a>
      </div>
    `,
  },
};

export const emailTemplateService = new EmailTemplateService();
