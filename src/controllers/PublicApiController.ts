import { Request, Response, NextFunction } from 'express';
import { Event } from '../models/Event';
import { Workspace } from '../models/Workspace';
import { Booking } from '../models/Booking';
import { News } from '../models/News';
import { Homepage } from '../models/Homepage';
import { Sponsor } from '../models/Sponsor';
import { Partner } from '../models/Partner';
import { Testimonial } from '../models/Testimonial';
import { Payment, PaymentStatus } from '../models/Payment';
import { Tenant } from '../models/Tenant';
import { ApiResponse } from '../utils/response';
import { EventStatus, EventVisibility } from '../types';

export class PublicApiController {
  /**
   * GET /api/events
   * Fetch all published, public events
   */
  public async getEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search, category } = req.query;
      const query: any = {
        status: EventStatus.PUBLISHED,
        visibility: EventVisibility.PUBLIC,
      };

      if (category) {
        query.category = String(category);
      }

      if (search) {
        const regex = new RegExp(String(search), 'i');
        query.$or = [
          { title: regex },
          { description: regex },
          { category: regex },
          { tags: { $in: [regex] } },
        ];
      }

      const events = await Event.find(query).sort({ 'schedule.startDate': 1 }).exec();
      ApiResponse.success(res, events);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/events/upcoming
   */
  public async getUpcomingEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const now = new Date();
      const query = {
        status: EventStatus.PUBLISHED,
        visibility: EventVisibility.PUBLIC,
        'schedule.startDate': { $gt: now }
      };
      const events = await Event.find(query).sort({ 'schedule.startDate': 1 }).exec();
      ApiResponse.success(res, events);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/events/ongoing
   */
  public async getOngoingEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const now = new Date();
      const query = {
        status: EventStatus.PUBLISHED,
        visibility: EventVisibility.PUBLIC,
        'schedule.startDate': { $lte: now },
        'schedule.endDate': { $gte: now }
      };
      const events = await Event.find(query).sort({ 'schedule.startDate': 1 }).exec();
      ApiResponse.success(res, events);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/events/completed
   */
  public async getCompletedEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const now = new Date();
      const query = {
        status: EventStatus.PUBLISHED,
        visibility: EventVisibility.PUBLIC,
        'schedule.endDate': { $lt: now }
      };
      const events = await Event.find(query).sort({ 'schedule.startDate': -1 }).exec();
      ApiResponse.success(res, events);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/events/featured
   */
  public async getFeaturedEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = {
        status: EventStatus.PUBLISHED,
        visibility: EventVisibility.PUBLIC,
        tags: { $in: ['featured', 'summit', 'hackathon'] }
      };
      const events = await Event.find(query).sort({ 'schedule.startDate': 1 }).limit(6).exec();
      ApiResponse.success(res, events);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/workspaces
   * Fetch all active workspaces
   */
  public async getWorkspaces(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { type, search } = req.query;
      const query: any = { isDeleted: false, isAvailable: true };

      if (type) {
        query.type = String(type);
      }

      if (search) {
        const regex = new RegExp(String(search), 'i');
        query.$or = [
          { name: regex },
          { amenities: { $in: [regex] } }
        ];
      }

      const workspaces = await Workspace.find(query).sort({ createdAt: -1 }).exec();
      ApiResponse.success(res, workspaces);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/workspaces/:id
   */
  public async getWorkspaceById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const workspace = await Workspace.findOne({ _id: id, isDeleted: false }).exec();
      if (!workspace) {
        res.status(404).json({ success: false, message: 'Workspace space not found' });
        return;
      }
      ApiResponse.success(res, workspace);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/workspaces/availability
   * Queries if a specific workspace space is available or gets the calendar availability
   */
  public async getWorkspaceAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { workspaceId, startTime, endTime } = req.query;

      if (!workspaceId) {
        res.status(400).json({ success: false, message: 'workspaceId is required' });
        return;
      }

      if (!startTime || !endTime) {
        // If start/end times aren't specified, return the overall booked dates/times to feed an interactive calendar
        const bookings = await Booking.find({
          spaceId: String(workspaceId),
          status: { $in: ['CONFIRMED', 'PENDING_APPROVAL'] },
          endTime: { $gte: new Date() }
        }).select('startTime endTime status').exec();

        ApiResponse.success(res, {
          workspaceId,
          busySlots: bookings.map(b => ({
            startTime: b.startTime,
            endTime: b.endTime,
            status: b.status
          }))
        });
        return;
      }

      const start = new Date(String(startTime));
      const end = new Date(String(endTime));

      if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
        res.status(400).json({ success: false, message: 'Invalid start or end times' });
        return;
      }

      // Overlap checks
      const overlapping = await Booking.findOne({
        spaceId: String(workspaceId),
        status: { $in: ['CONFIRMED', 'PENDING_APPROVAL'] },
        $or: [
          { startTime: { $lt: end }, endTime: { $gt: start } }
        ]
      }).exec();

      ApiResponse.success(res, {
        workspaceId,
        available: !overlapping,
        reason: overlapping ? 'Conflict detected with an existing reservation.' : 'Available'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/bookings
   * Create an online workspace reservation with automated double-booking prevention & checkout payment support
   */
  public async createBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { spaceId, startTime, endTime, purpose, userEmail, userName, paymentProvider } = req.body;

      if (!spaceId || !startTime || !endTime || !userEmail) {
        res.status(400).json({ success: false, message: 'spaceId, startTime, endTime, and userEmail are required' });
        return;
      }

      const workspace = await Workspace.findOne({ _id: spaceId, isDeleted: false, isAvailable: true }).exec();
      if (!workspace) {
        res.status(404).json({ success: false, message: 'Workspace space not found or unavailable' });
        return;
      }

      const start = new Date(startTime);
      const end = new Date(endTime);

      if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
        res.status(400).json({ success: false, message: 'Start time must be strictly earlier than end time' });
        return;
      }

      // Double-booking check
      const overlapping = await Booking.findOne({
        spaceId,
        status: { $in: ['CONFIRMED', 'PENDING_APPROVAL'] },
        $or: [
          { startTime: { $lt: end }, endTime: { $gt: start } }
        ]
      }).exec();

      if (overlapping) {
        res.status(409).json({
          success: false,
          message: 'Conflict detected: This workspace interval is already booked.'
        });
        return;
      }

      // Calculate price
      const diffMs = end.getTime() - start.getTime();
      const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
      const totalAmount = diffHours * workspace.hourlyRate;

      // Create booking document
      const uniqueHash = Math.random().toString(36).substring(2, 10).toUpperCase();
      const qrCode = `WVENTURE-BKG-${uniqueHash}`;

      // If user is authenticated, we can associate the id, otherwise mark as guest
      const userId = (req as any).user?.id || 'guest';

      const booking = await Booking.create({
        tenantId: workspace.tenantId || 'weventurehub',
        userId,
        userEmail,
        spaceId,
        startTime: start,
        endTime: end,
        totalAmount,
        status: workspace.type === 'HOT_DESK' ? 'CONFIRMED' : 'PENDING_APPROVAL',
        purpose: purpose || 'Workspace Utilization',
        qrCode,
      });

      // Also seed a successful Payment record if payment provider is selected
      if (paymentProvider) {
        const txRef = `TX-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        await Payment.create({
          tenantId: workspace.tenantId || 'weventurehub',
          userId,
          userEmail,
          bookingId: booking._id.toString(),
          amount: totalAmount,
          currency: 'ETB',
          status: PaymentStatus.SUCCESSFUL,
          provider: paymentProvider,
          txRef,
          metadata: {
            userName: userName || 'Guest User',
            startTime,
            endTime,
            workspaceName: workspace.name
          }
        });
      }

      ApiResponse.success(res, booking, 201, {
        message: 'Booking created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/news
   * Fetch all news, announcements, blogs, startup stories, community news, etc.
   */
  public async getNews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { category, search } = req.query;
      const query: any = { isPublished: true };

      if (category) {
        query.category = String(category);
      }

      if (search) {
        const regex = new RegExp(String(search), 'i');
        query.$or = [
          { title: regex },
          { content: regex },
          { tags: { $in: [regex] } },
        ];
      }

      const newsItems = await News.find(query).sort({ createdAt: -1 }).exec();
      ApiResponse.success(res, newsItems);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/homepage
   * Fetch homepage dynamic content configurations
   */
  public async getHomepage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let homepage = await Homepage.findOne({ tenantId: 'weventurehub' } as any).lean().exec();
      const tenant = await Tenant.findById('weventurehub').lean().exec();

      let mergedHomepage: any = homepage ? { ...homepage } : {
        heroTitle: 'Where Modern Ethiopian Startups Scale and Innovate',
        heroSubtitle: 'Instant booking for premium meeting rooms, dedicated workspaces, and world-class accelerator programs tailored to high-growth operators.',
        heroCtaText: 'Explore Available Spaces',
        heroCtaLink: '/workspaces',
        heroImageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200',
        promotionTitle: 'Hot Desk Summer Promo',
        promotionSubtitle: 'Access Silicon Core Hub 24/7 with premium coffee, high-speed fiber internet, and free meeting hours.',
        promotionImageUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=600',
        promotionPrice: '$110/mo',
        communityHighlights: [
          { title: 'Tech Accelerator cohort', description: 'Over 24 companies incubated annually.', imageUrl: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&q=80&w=300' },
          { title: 'B2B Technical mixers', description: 'Monthly networking events with founders.', imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=300' }
        ],
        startupPrograms: [
          { title: 'Silicon Addis Incubation', description: 'An intensive 12-week program for pre-product startup teams in Addis Ababa. Includes 100K Birr grant and mentorship.', duration: '12 Weeks', cohortSize: 8, ctaText: 'Apply Cohort' },
          { title: 'AI Engineering Mastery', description: 'Advanced training on deep learning, prompt engineering, and LLM orchestration.', duration: '6 Weeks', cohortSize: 20, ctaText: 'Join Mastery Program' }
        ]
      };

      if (tenant && tenant.website && tenant.website.enabled) {
        if (tenant.website.hero) {
          mergedHomepage.heroTitle = tenant.website.hero.title || mergedHomepage.heroTitle;
          mergedHomepage.heroSubtitle = tenant.website.hero.subtitle || mergedHomepage.heroSubtitle;
          mergedHomepage.heroCtaText = tenant.website.hero.ctaText || mergedHomepage.heroCtaText;
          mergedHomepage.heroCtaLink = tenant.website.hero.ctaLink || mergedHomepage.heroCtaLink;
          mergedHomepage.heroImageUrl = tenant.website.hero.backgroundImageUrl || mergedHomepage.heroImageUrl;
        }
        if (tenant.website.about) {
          if (tenant.website.about.title) {
            mergedHomepage.promotionTitle = tenant.website.about.title;
          }
          if (tenant.website.about.description) {
            mergedHomepage.promotionSubtitle = tenant.website.about.description;
          }
          if (tenant.website.about.highlights && tenant.website.about.highlights.length > 0) {
            mergedHomepage.communityHighlights = tenant.website.about.highlights.map((h: string) => ({
              title: h,
              description: 'WeVentureHub highlight standard.',
              imageUrl: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&q=80&w=300'
            }));
          }
        }
      }

      ApiResponse.success(res, mergedHomepage);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/sponsors
   */
  public async getSponsors(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sponsors = await Sponsor.find({ isPublished: true } as any).sort({ tier: 1 }).exec();
      ApiResponse.success(res, sponsors);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/partners
   */
  public async getPartners(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const partners = await Partner.find({ isPublished: true } as any).sort({ type: 1 }).exec();
      ApiResponse.success(res, partners);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/testimonials
   */
  public async getTestimonials(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const testimonials = await Testimonial.find({ isPublished: true } as any).exec();
      ApiResponse.success(res, testimonials);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/about
   */
  public async getAbout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { AboutPage } = await import('../models/AboutPage');
      let about = await (AboutPage as any).findOne({ tenantId: 'weventurehub' }).lean();
      if (!about) {
        about = {
          mission: 'To foster high-impact entrepreneurship across East Africa by uniting founders, workspace resources, and capital.',
          vision: 'To build Africa\'s premier interconnected ecosystem for technological innovation and collaborative workspaces.',
          companyDescription: 'WeVentureHub is an elite innovation & coworking space located in the heart of Addis Ababa.',
          history: 'Founded in 2024, WeVentureHub has scaled from a single coworking floor into a full-scale accelerator and event hub.',
          coreValues: [
            { title: 'Integrity & Trust', description: 'Excellence in service and transparent operations.' },
            { title: 'Community First', description: 'Collaborative growth over isolated hustle.' },
            { title: 'Innovation Driven', description: 'Leveraging cutting-edge tech and automation.' }
          ],
          teamMembers: [
            { name: 'Dr. Yonas Alemu', role: 'Chief Executive Officer', bio: 'Tech visionary with 15+ years experience in African venture building.' },
            { name: 'Bethlehem Tadesse', role: 'Head of Operations', bio: 'Community architect dedicated to startup growth.' }
          ],
          timeline: [
            { year: '2024', title: 'Hub Launched', description: 'Opened Bole Silicon Center floor.' },
            { year: '2025', title: 'Accelerator Cohort 1', description: 'Graduated 12 high-growth startups.' },
            { year: '2026', title: 'Enterprise Expansion', description: 'Integrated dynamic workspace booking engine.' }
          ]
        };
      }
      ApiResponse.success(res, about);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/faqs
   */
  public async getFaqs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { Faq } = await import('../models/Faq');
      const faqs = await (Faq as any).find({ isPublished: true, isDeleted: { $ne: true } }).sort({ sortOrder: 1, createdAt: -1 }).exec();
      ApiResponse.success(res, faqs);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/company-info
   */
  public async getCompanyInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { CompanyInfo } = await import('../models/CompanyInfo');
      let info = await (CompanyInfo as any).findOne({ tenantId: 'weventurehub' }).lean();
      if (!info) {
        info = {
          companyName: 'WeVentureHub',
          tagline: 'The Premier Entrepreneurship & Coworking Hub in Addis Ababa',
          description: 'WeVentureHub empowers African startups, founders, and enterprises with world-class workspaces and event acceleration.',
          phoneNumbers: ['+251 911 234 567', '+251 116 890 123'],
          emailAddresses: ['info@weventurehub.com', 'support@weventurehub.com'],
          officeAddress: 'Bole Road, Next to Sunshine Building, Floor 4, Addis Ababa, Ethiopia',
          city: 'Addis Ababa',
          country: 'Ethiopia',
          workingHours: 'Mon - Sat: 8:00 AM - 10:00 PM | Sun: Closed',
          emergencyContact: '+251 911 000 000',
          googleMapEmbedUrl: 'https://maps.google.com',
          socialMediaLinks: {
            facebook: 'https://facebook.com/weventurehub',
            twitter: 'https://twitter.com/weventurehub',
            linkedin: 'https://linkedin.com/company/weventurehub',
            instagram: 'https://instagram.com/weventurehub',
            telegram: 'https://t.me/weventurehub',
          },
          logoUrl: '/logo.png',
          footerText: '© 2026 WeVentureHub. All rights reserved.'
        };
      }
      ApiResponse.success(res, info);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/navigation
   */
  public async getNavigation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { NavigationMenu } = await import('../models/NavigationMenu');
      const menus = await (NavigationMenu as any).find({ tenantId: 'weventurehub' }).exec();
      ApiResponse.success(res, menus);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/plans
   */
  public async getPlans(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { Plan } = await import('../models/Plan');
      const plans = await Plan.find({ isCustom: false }).exec();
      ApiResponse.success(res, plans);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/galleries
   */
  public async getGalleries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { Gallery } = await import('../models/Gallery');
      const galleries = await (Gallery as any).find({ isPublished: true }).sort({ createdAt: -1 }).exec();
      ApiResponse.success(res, galleries);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/contact
   */
  public async submitInquiry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantHeader = req.headers['x-tenant-id'] || 'weventurehub';
      const tenantId = Array.isArray(tenantHeader) ? tenantHeader[0] : tenantHeader;
      const { name, email, message } = req.body;
      if (!name || !email || !message) {
        res.status(400).json({ success: false, message: 'Name, email, and message are required' });
        return;
      }

      const nameParts = name.trim().split(/\s+/);
      const firstName = nameParts[0] || 'Inquirer';
      const lastName = nameParts.slice(1).join(' ') || 'Contact';

      const { Contact } = await import('../models/Contact');
      
      const newContact = new Contact({
        tenantId,
        firstName,
        lastName,
        email,
        status: 'LEAD',
        leadSource: 'Landing Page Contact Form',
        notes: [
          {
            author: 'System Auto-Log',
            content: `Submitted website inquiry message: "${message}"`,
            createdAt: new Date(),
          }
        ]
      });

      await newContact.save();

      ApiResponse.success(res, { success: true, message: 'Inquiry saved successfully.' });
    } catch (error) {
      next(error);
    }
  }
}

export const publicApiController = new PublicApiController();
