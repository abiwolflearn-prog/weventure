import { GoogleGenAI } from '@google/genai';
import { Workspace } from '../models/Workspace';
import { Event } from '../models/Event';
import { Plan } from '../models/Plan';
import { Booking } from '../models/Booking';
import { Invoice } from '../models/Invoice';
import { Agreement } from '../models/Agreement';
import { Registration } from '../models/Registration';
import { News } from '../models/News';
import { Partner } from '../models/Partner';
import { SupportTicket } from '../models/SupportTicket';
import { AssistantConversation, IAssistantMessage } from '../models/AssistantChat';
import { EventStatus } from '../types';
import { logger } from '../utils/logger';

// Initialize server-side Google GenAI client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export interface IChatOptions {
  tenantId?: string;
  sessionId: string;
  userPrompt: string;
  language?: 'en' | 'am' | 'om';
  userId?: string;
  userEmail?: string;
  userName?: string;
  userRole?: string;
}

export class AiAssistantService {
  /**
   * Retrieves live database context to ground Gemini responses without hallucinations.
   */
  private async getDatabaseContext(options: IChatOptions) {
    const tenantId = options.tenantId || 'weventurehub';
    const context: any = {
      weventureInfo: {
        name: 'WeVentureHub Event & Workspace Management Platform',
        address: 'Airport Road, Sur Construction second floor, Addis Ababa',
        email: 'info@weventurehub.com',
        phone: '091 124 3503',
        workingHours: 'Mon - Sat: 8:00 AM - 10:00 PM | Sun: Closed',
        amenities: [
          'High-speed Fiber Wi-Fi (100 Mbps+)',
          'Barista Coffee & Refreshment Lounge',
          'Modern Meeting Rooms & Smart Projectors',
          'Soundproof Telephone & Podcasting Booths',
          'Printing, Scanning & Stationeries',
          'Secure Lockers & 24/7 CCTV Monitoring',
          'Underground Parking & Electric Charging',
          'Incubation & Startup Acceleration Mentorship',
        ],
        paymentMethods: [
          'ArifPay',
          'Telebirr',
          'Commercial Bank of Ethiopia (CBE Birr)',
          'Awash Bank',
          'Dashen Bank',
          'Credit/Debit Cards & Wire Transfers',
        ],
        policies: {
          refunds: 'Full refund if cancelled 48 hours before workspace booking or event start date. 50% refund within 24 hours. No refund after session begins.',
          agreements: 'Monthly and annual desk/office bookings generate an automated digital WeVentureHub Lease Agreement subject to e-signature.',
          renewals: 'Auto-renewal invoice is generated 7 days prior to expiry. Grace period is 3 days after due date.',
          codeOfConduct: 'Respect quiet areas in hot desk zones, clean up after using meeting rooms, and adhere to community guidelines.',
        },
      },
      workspaces: [],
      events: [],
      plans: [],
      news: [],
      partners: [],
    };

    try {
      // 1. Fetch available workspaces
      const workspaces = await Workspace.find({ isDeleted: false }).limit(20).lean();
      context.workspaces = workspaces.map((w) => ({
        id: w._id ? w._id.toString() : w.id,
        name: w.name,
        type: w.type, // HOT_DESK, MEETING_ROOM, EVENT_VENUE
        capacity: w.capacity,
        hourlyRate: w.hourlyRate,
        dailyRate: w.dailyRate || w.hourlyRate * 8 * 0.85,
        currency: w.currency || 'ETB',
        amenities: w.amenities || [],
        isAvailable: w.isAvailable,
        billingPlans: w.billingPlans || [],
      }));

      // 2. Fetch upcoming events
      const events = await Event.find({
        status: { $in: [EventStatus.PUBLISHED, EventStatus.DRAFT] },
      } as any)
        .sort({ 'schedule.startDate': 1 })
        .limit(10)
        .lean();

      context.events = events.map((e: any) => ({
        id: e._id ? e._id.toString() : e.id,
        title: e.title,
        slug: e.slug,
        category: e.category,
        startDate: e.schedule?.startDate,
        endDate: e.schedule?.endDate,
        capacity: e.capacity?.maxCapacity,
        activeRegistrations: e.capacity?.activeRegistrations,
        description: e.description ? e.description.substring(0, 200) + '...' : '',
      }));

      // 3. Fetch membership & pricing plans
      const plans = await Plan.find({}).lean();
      context.plans = plans.map((p: any) => ({
        id: p._id ? p._id.toString() : p.id,
        name: p.name,
        description: p.description,
        priceMonthly: p.priceMonthly,
        priceYearly: p.priceYearly,
        limits: p.limits,
      }));

      // 4. Fetch public news and partners
      const newsList = await News.find({ isPublished: true } as any).sort({ createdAt: -1 }).limit(3).lean();
      context.news = newsList.map((n: any) => ({ title: n.title, summary: n.summary || n.content?.substring(0, 100) }));

      const partnerList = await Partner.find({ isActive: true } as any).limit(5).lean();
      context.partners = partnerList.map((pt: any) => ({ name: pt.name, category: pt.category }));

      // 5. User-specific Context (if authenticated user)
      if (options.userId || options.userEmail) {
        const queryUserId = options.userId;
        const queryEmail = options.userEmail;

        const userBookings = await Booking.find({
          $or: [{ userId: queryUserId }, { userEmail: queryEmail }],
        })
          .sort({ createdAt: -1 })
          .limit(5)
          .lean();

        const userInvoices = await Invoice.find({
          $or: [{ userId: queryUserId }, { userEmail: queryEmail }],
        })
          .sort({ createdAt: -1 })
          .limit(5)
          .lean();

        const userAgreements = await Agreement.find({
          $or: [{ userId: queryUserId }, { userEmail: queryEmail }],
        })
          .sort({ createdAt: -1 })
          .limit(3)
          .lean();

        const userRegistrations = await Registration.find({
          $or: [{ userId: queryUserId }, { email: queryEmail }],
        })
          .sort({ createdAt: -1 })
          .limit(5)
          .lean();

        context.userPersonalData = {
          bookings: userBookings.map((b: any) => ({
            id: b._id ? b._id.toString() : b.id,
            spaceId: b.spaceId,
            status: b.status,
            startTime: b.startTime,
            endTime: b.endTime,
            totalAmount: b.totalAmount,
            billingPlanName: b.billingPlanName,
          })),
          invoices: userInvoices.map((inv: any) => ({
            invoiceNumber: inv.invoiceNumber,
            amount: inv.amount,
            currency: inv.currency,
            status: inv.status,
            dueDate: inv.dueDate,
          })),
          agreements: userAgreements.map((ag: any) => ({
            agreementNumber: ag.agreementNumber,
            title: ag.title || 'Workspace Agreement',
            status: ag.status,
            effectiveDate: ag.startDate || ag.effectiveDate,
            expiryDate: ag.endDate || ag.expiryDate,
          })),
          registrations: userRegistrations.map((rg: any) => ({
            eventId: rg.eventId,
            ticketType: rg.ticketType || rg.ticketTypeId,
            status: rg.status,
            qrCode: rg.qrCode,
          })),
        };
      }

      // 6. Admin Operational Context (if admin user)
      const isAdminRole =
        options.userRole &&
        ['super_admin', 'admin', 'event_manager', 'workspace_manager', 'operator', 'finance_officer', 'staff'].includes(
          options.userRole.toLowerCase()
        );

      if (isAdminRole) {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const todayBookingsCount = await Booking.countDocuments({ createdAt: { $gte: todayStart } });
        const pendingApprovalsCount = await Booking.countDocuments({ status: 'PENDING_APPROVAL' });

        const invoicesPaidThisMonth = await Invoice.find({
          status: 'PAID' as any,
          paidAt: { $gte: monthStart },
        }).lean();


        const monthlyRevenue = invoicesPaidThisMonth.reduce((acc, inv) => acc + (inv.amount || 0), 0);
        const pendingTicketsCount = await SupportTicket.countDocuments({ status: { $in: ['open', 'in_progress'] } });

        context.adminOperationalData = {
          todayBookingsCount,
          pendingApprovalsCount,
          monthlyRevenue,
          pendingTicketsCount,
          totalWorkspaces: context.workspaces.length,
          totalActiveEvents: context.events.length,
        };
      }
    } catch (err) {
      logger.error('Error fetching RAG database context for AI Assistant:', err);
    }

    return context;
  }

  /**
   * Process incoming user chat message with RAG grounded context and Gemini AI reasoning.
   */
  public async processChatMessage(options: IChatOptions): Promise<{
    message: IAssistantMessage;
    conversationId: string;
    suggestedActions?: any[];
  }> {
    const startTime = Date.now();
    const language = options.language || 'en';
    const tenantId = options.tenantId || 'weventurehub';

    // 1. Retrieve or create conversation history in MongoDB
    let conversation = await AssistantConversation.findOne({ sessionId: options.sessionId, tenantId });
    if (!conversation) {
      conversation = new AssistantConversation({
        tenantId,
        sessionId: options.sessionId,
        userId: options.userId,
        userEmail: options.userEmail,
        userName: options.userName || 'Visitor',
        userRole: options.userRole || 'guest',
        language,
        messages: [],
      });
    }

    // Append user's message to conversation history
    const userMessage: IAssistantMessage = {
      sender: 'user',
      text: options.userPrompt,
      language,
      timestamp: new Date(),
    };
    conversation.messages.push(userMessage);

    // 2. Fetch ground-truth MongoDB context
    const dbContext = await this.getDatabaseContext(options);

    // 3. Construct System Instructions & Language Directives
    let languageInstruction = 'Respond in fluent, friendly professional English.';
    if (language === 'am') {
      languageInstruction =
        'Respond in clear, natural, and friendly Amharic (አማርኛ). Use proper Amharic greetings and professional business tone.';
    } else if (language === 'om') {
      languageInstruction =
        'Respond in clear, natural, and friendly Afaan Oromoo. Use proper Afaan Oromoo greetings and professional business tone.';
    }

    const systemInstruction = `
You are "WeVenture Assistant", the official enterprise AI Virtual Assistant for WeVentureHub Event & Workspace Management Platform in Addis Ababa, Ethiopia.

BRAND PERSONALITY:
- Name: WeVenture Assistant
- Persona: Friendly, highly professional, fast, business-oriented, startup-focused, concise, and accurate.
- Greeting context: Help visitors, hub members, event organizers, workspace customers, and hub administrators.
- Core Values: Never guess or hallucinate pricing, workspace availability, or event tickets. Always verify against the provided DATABASE CONTEXT.

DATABASE CONTEXT (GROUND TRUTH FROM MONGODB):
${JSON.stringify(dbContext, null, 2)}

ROLE & PERMISSION RULES:
- If user is a visitor/guest: Answer general questions, workspace specs, event schedules, membership plans, amenities, payments, and offer booking/registration links or support ticket creation.
- If user has personal data in context: Answer their specific booking, invoice, agreement, payment, or registration details accurately.
- If user is an Admin/Staff: Answer administrative operational metrics (today's bookings, revenue, pending approvals, workspace occupancy, pending support tickets).
- NEVER expose sensitive private data of other users or raw tokens/passwords/credentials.

MULTILINGUAL REQUIREMENT:
${languageInstruction}

ACTION & SUGGESTION FORMAT:
If the response naturally includes a recommendation or direct action (e.g., booking a specific workspace, registering for an event, or opening a support ticket), formulate your text clearly and concise.
`;

    // Format recent chat history for Gemini context
    const recentMessages = conversation.messages.slice(-8).map((msg) => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    }));

    let aiResponseText = '';
    let detectedActions: any[] = [];

    try {
      // Call Gemini 3.6 Flash via @google/genai SDK
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: [
          ...recentMessages,
          {
            role: 'user',
            parts: [{ text: options.userPrompt }],
          },
        ],
        config: {
          systemInstruction,
          temperature: 0.3, // Low temperature for high accuracy and minimal hallucination
        },
      });

      aiResponseText = response.text || 'I am ready to assist you with WeVentureHub workspaces, events, and services!';
    } catch (err: any) {
      logger.error('Gemini API call failed in WeVenture Assistant, falling back to heuristic response generator:', err);

      // Fallback heuristic response engine using RAG context directly if API key is unconfigured or rate limited
      aiResponseText = this.generateFallbackResponse(options.userPrompt, dbContext, language);
    }

    // 4. Derive interactive smart action buttons for frontend UI
    detectedActions = this.extractSmartActions(options.userPrompt, dbContext);

    // Build final Assistant Message
    const responseTimeMs = Date.now() - startTime;
    const assistantMessage: IAssistantMessage = {
      sender: 'assistant',
      text: aiResponseText,
      language,
      timestamp: new Date(),
      actions: detectedActions,
      ragGrounding: {
        sourceTypes: ['workspaces', 'events', 'plans', 'userPersonalData', 'adminOperationalData'].filter(
          (k) => !!(dbContext as any)[k]
        ),
        foundCount: (dbContext.workspaces?.length || 0) + (dbContext.events?.length || 0),
      },
    };

    // Save to conversation
    conversation.messages.push(assistantMessage);
    conversation.totalMessages = conversation.messages.length;
    conversation.aiHandledCount += 1;
    conversation.avgResponseTimeMs = Math.round(
      ((conversation.avgResponseTimeMs || 0) + responseTimeMs) / (conversation.aiHandledCount || 1)
    );
    await conversation.save();

    return {
      message: assistantMessage,
      conversationId: conversation.id,
      suggestedActions: detectedActions,
    };
  }

  /**
   * Helper to extract interactive action prompts (Book, Register, Invoices, Support)
   */
  private extractSmartActions(prompt: string, dbContext: any): any[] {
    const actions: any[] = [];
    const lower = prompt.toLowerCase();

    if (lower.includes('book') || lower.includes('workspace') || lower.includes('desk') || lower.includes('meeting room')) {
      if (dbContext.workspaces && dbContext.workspaces.length > 0) {
        const topSpace = dbContext.workspaces[0];
        actions.push({
          type: 'BOOK_WORKSPACE',
          label: `Book ${topSpace.name}`,
          payload: { spaceId: topSpace.id, name: topSpace.name, price: topSpace.hourlyRate, type: topSpace.type },
        });
      }
    }

    if (lower.includes('event') || lower.includes('workshop') || lower.includes('ticket') || lower.includes('register')) {
      if (dbContext.events && dbContext.events.length > 0) {
        const topEvent = dbContext.events[0];
        actions.push({
          type: 'REGISTER_EVENT',
          label: `Register for ${topEvent.title}`,
          payload: { eventId: topEvent.id, slug: topEvent.slug, title: topEvent.title },
        });
      }
    }

    if (lower.includes('invoice') || lower.includes('payment') || lower.includes('bill') || lower.includes('telebirr') || lower.includes('arifpay')) {
      actions.push({
        type: 'PAYMENT_HELP',
        label: 'View Payment Gateways & Invoices',
        payload: { action: 'open_payments_info' },
      });
    }

    if (lower.includes('human') || lower.includes('support') || lower.includes('help') || lower.includes('agent') || lower.includes('ticket')) {
      actions.push({
        type: 'SUPPORT_TICKET',
        label: 'Connect with Human Support Agent',
        payload: { action: 'create_support_ticket' },
      });
    }

    return actions;
  }

  /**
   * Robust heuristic fallback when external AI model connectivity is offline or unconfigured.
   */
  private generateFallbackResponse(prompt: string, context: any, lang: string): string {
    const p = prompt.toLowerCase();

    if (p.includes('hello') || p.includes('hi') || p.includes('hey') || p.includes('selam') || p.includes('akkam')) {
      if (lang === 'am') {
        return '👋 እንኳን ወደ WeVentureHub በደህና መጡ! የስራ ቦታዎችን ለመያዝ፣ ለክስተቶች ለመመዝገብ እና ስለ አባልነቶች ለመጠየቅ እረዳዎታለሁ። ዛሬ እንዴት ልረዳዎት?';
      }
      if (lang === 'om') {
        return '👋 Baga nagaan gara WeVentureHub dhuftan! Iddoo hojii qabachuuf, sagantaawwan irratti galmaa\'uuf fi waan biraafas isin gargaaruu nan danda\'a. Arra maaliin isin gargaaru?';
      }
      return "👋 Welcome to WeVentureHub! I am your AI assistant. I can help you book workspaces, register for events, answer questions, explain invoices and agreements, and guide you through our services. How can I help you today?";
    }

    if (p.includes('workspace') || p.includes('desk') || p.includes('office') || p.includes('meeting')) {
      const spaces = context.workspaces || [];
      if (spaces.length > 0) {
        const list = spaces
          .slice(0, 3)
          .map((s: any) => `• ${s.name} (${s.type}): ${s.hourlyRate} ${s.currency}/hr (Capacity: ${s.capacity})`)
          .join('\n');
        return `We have high-grade workspaces available at WeVentureHub:\n\n${list}\n\nAll workspaces include fiber Wi-Fi, coffee, printing, and receptionist services. Would you like to proceed with a booking?`;
      }
      return "We offer Hot Desks, Dedicated Desks, Private Offices, and Smart Meeting Rooms equipped with high-speed fiber internet and barista coffee. Check out our Workspaces tab for real-time availability!";
    }

    if (p.includes('event') || p.includes('workshop') || p.includes('ticket') || p.includes('program')) {
      const events = context.events || [];
      if (events.length > 0) {
        const list = events
          .slice(0, 3)
          .map((e: any) => `• ${e.title} (${e.category}) - ${new Date(e.startDate).toLocaleDateString()}`)
          .join('\n');
        return `Here are upcoming featured events at WeVentureHub:\n\n${list}\n\nYou can view full details or register directly!`;
      }
      return "We regularly host tech workshops, founder pitch nights, startup incubation sessions, and investor networking events. Visit our Events section to register!";
    }

    if (p.includes('payment') || p.includes('telebirr') || p.includes('arifpay') || p.includes('cbe') || p.includes('invoice')) {
      return "WeVentureHub accepts local and international payments via ArifPay, Telebirr, Commercial Bank of Ethiopia (CBE Birr), Awash Bank, Dashen Bank, and credit/debit cards. Digital VAT invoices and lease agreements are generated instantly upon confirmation!";
    }

    if (p.includes('location') || p.includes('where') || p.includes('address') || p.includes('hour') || p.includes('contact')) {
      return `📍 WeVentureHub Location:\n${context.weventureInfo.address}\n\n📞 Contact:\n${context.weventureInfo.phone} | ${context.weventureInfo.email}\n\n⏰ Operating Hours:\n${context.weventureInfo.workingHours}`;
    }

    return "Thank you for reaching out to WeVentureHub! I am here to assist with workspace bookings, event registrations, pricing plans, and support. Let me know what specific information or booking you need!";
  }
}

export const aiAssistantService = new AiAssistantService();
