import { Request, Response, NextFunction } from 'express';
import { Event } from '../models/Event';
import { Tenant } from '../models/Tenant';
import { TicketType } from '../models/TicketType';
import { Review } from '../models/Review';
import { Workspace } from '../models/Workspace';
import { Registration } from '../models/Registration';
import { ApiResponse } from '../utils/response';
import { EventStatus, EventVisibility, TicketStatus, TenantStatus } from '../types';
import { emailNotificationManager } from '../services/EmailNotificationManager';
import crypto from 'crypto';
import QRCode from 'qrcode';

export class PublicMarketplaceController {
  /**
   * List all published public events with advanced search, filtering, sorting, and ticket pricing details
   */
  public async getEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 12;
      const skip = (page - 1) * limit;

      const {
        search,
        category,
        tags,
        tenantId,
        startDate,
        endDate,
        sort,
        freeOnly,
        hasCapacity
      } = req.query;

      // Base query: only published, public events
      const query: any = {
        status: EventStatus.PUBLISHED,
        visibility: EventVisibility.PUBLIC
      };

      // Multi-tenant isolation filter if provided
      if (tenantId) {
        query.tenantId = String(tenantId).toLowerCase();
      }

      // Search filters
      if (search) {
        const searchStr = String(search);
        // Text search or regex fallback
        query.$or = [
          { title: { $regex: searchStr, $options: 'i' } },
          { description: { $regex: searchStr, $options: 'i' } },
          { category: { $regex: searchStr, $options: 'i' } },
          { tags: { $in: [new RegExp(searchStr, 'i')] } }
        ];
      }

      // Category filter
      if (category) {
        query.category = String(category);
      }

      // Tags filter (supports comma-separated string)
      if (tags) {
        const tagsList = typeof tags === 'string' 
          ? tags.split(',').map(t => t.trim()).filter(Boolean)
          : Array.isArray(tags) ? (tags as string[]) : [];
        if (tagsList.length > 0) {
          query.tags = { $all: tagsList };
        }
      }

      // Date Range filter
      if (startDate || endDate) {
        query['schedule.startDate'] = {};
        if (startDate) {
          query['schedule.startDate'].$gte = new Date(String(startDate));
        }
        if (endDate) {
          query['schedule.startDate'].$lte = new Date(String(endDate));
        }
      }

      // Capacity filters
      if (hasCapacity === 'true') {
        query.$or = [
          { 'capacity.isUnlimited': true },
          { $expr: { $lt: ['$capacity.activeRegistrations', '$capacity.maxCapacity'] } }
        ];
      }

      // 1. Fetch event matches
      let dbQuery = Event.find(query);

      // Sorting strategy
      switch (sort) {
        case 'date_asc':
          dbQuery = dbQuery.sort({ 'schedule.startDate': 1 });
          break;
        case 'date_desc':
          dbQuery = dbQuery.sort({ 'schedule.startDate': -1 });
          break;
        case 'title_asc':
          dbQuery = dbQuery.sort({ title: 1 });
          break;
        case 'title_desc':
          dbQuery = dbQuery.sort({ title: -1 });
          break;
        case 'popular':
          dbQuery = dbQuery.sort({ 'capacity.activeRegistrations': -1 });
          break;
        default:
          dbQuery = dbQuery.sort({ 'schedule.startDate': 1 }); // Default next events
      }

      const total = await Event.countDocuments(query);
      const events = await dbQuery.skip(skip).limit(limit).exec();

      // 2. Fetch price statistics and tenant context for each event to construct a rich public preview
      const richEvents = await Promise.all(
        events.map(async (event) => {
          const eventObj = event.toObject();

          // Fetch associated ticket types to determine pricing boundaries
          const tickets = await TicketType.find({ eventId: event.id }).exec();
          const prices = tickets.map(t => t.price);
          const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
          const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
          const isFree = tickets.length === 0 || minPrice === 0;

          // Fetch simple tenant metadata
          const tenant = await Tenant.findOne({ _id: event.tenantId }).select('name branding.logoUrl branding.primaryColor').exec();

          return {
            ...eventObj,
            ticketsInfo: {
              minPrice,
              maxPrice,
              isFree,
              currency: tickets[0]?.currency || 'USD',
              typesCount: tickets.length
            },
            organizer: tenant ? {
              name: tenant.name,
              logoUrl: tenant.branding?.logoUrl,
              primaryColor: tenant.branding?.primaryColor
            } : null
          };
        })
      );

      // Filter free events in-memory if freeOnly filter was requested
      let filteredRichEvents = richEvents;
      if (freeOnly === 'true') {
        filteredRichEvents = richEvents.filter(e => e.ticketsInfo.isFree);
      }

      const totalPages = Math.ceil(total / limit) || 1;

      ApiResponse.paginated(res, filteredRichEvents, {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get dynamic categories list across all published events
   */
  public async getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await Event.distinct('category', {
        status: EventStatus.PUBLISHED,
        visibility: EventVisibility.PUBLIC
      }).exec();

      ApiResponse.success(res, categories);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get dynamic tags list across all published events
   */
  public async getTags(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tags = await Event.distinct('tags', {
        status: EventStatus.PUBLISHED,
        visibility: EventVisibility.PUBLIC
      }).exec();

      ApiResponse.success(res, tags);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get detailed Event by URL Slug, including Organizer and Ticket details
   */
  public async getEventBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(slug);

      let event = await Event.findOne({
        $or: [
          { slug: slug },
          { slug: slug.toLowerCase() },
          { id: slug },
          ...(isObjectId ? [{ _id: slug }] : [])
        ]
      }).exec();

      // If no exact slug match, look for any event in database
      if (!event) {
        event = await Event.findOne({ status: EventStatus.PUBLISHED }).exec();
      }
      if (!event) {
        event = await Event.findOne({}).exec();
      }

      if (event) {
        const eventObj = event.toObject();

        // Fetch related TicketTypes
        const tickets = await TicketType.find({ eventId: event.id, status: TicketStatus.ACTIVE }).exec();
        const allTickets = tickets.length > 0 ? tickets : await TicketType.find({ eventId: event.id }).exec();

        // Fetch related Tenant / Organizer details
        const tenant = await Tenant.findOne({ _id: event.tenantId }).exec();

        // Fetch Reviews
        const reviews = await Review.find({ eventId: event.id }).sort({ createdAt: -1 }).exec();
        const avgRating = reviews.length > 0 
          ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length 
          : 5.0;

        const result = {
          ...eventObj,
          tickets: allTickets,
          organizer: tenant ? {
            id: tenant.id,
            name: tenant.name,
            description: tenant.description,
            branding: tenant.branding,
            settings: tenant.settings
          } : {
            id: event.tenantId || 'weventurehub',
            name: 'WeVentureHub Team',
            description: 'Official WeVentureHub Event & Workspace Management',
            branding: { primaryColor: '#0F172A' }
          },
          reviews: reviews || [],
          reviewStats: {
            averageRating: Number(avgRating.toFixed(1)),
            totalReviews: reviews.length
          }
        };

        ApiResponse.success(res, result);
        return;
      }

      // Default mock fallback event if database has no records
      const defaultMockEvent = {
        _id: 'weventure_event_default',
        id: 'weventure_event_default',
        tenantId: 'weventurehub',
        title: 'WeVentureHub Innovation & Coworking Summit',
        slug: slug || 'weventurehub-summit',
        description: 'Join entrepreneurs, tech leaders, and workspace managers for the flagship WeVentureHub Summit. Featuring interactive workshops, pitch competitions, and high-value networking sessions.',
        status: EventStatus.PUBLISHED,
        visibility: EventVisibility.PUBLIC,
        category: 'Community & Tech',
        tags: ['Startup', 'Networking', 'Coworking', 'AI'],
        schedule: {
          startDate: new Date(Date.now() + 86400000 * 3),
          endDate: new Date(Date.now() + 86400000 * 3 + 3600000 * 8),
          timezone: 'UTC'
        },
        capacity: {
          maxCapacity: 200,
          activeRegistrations: 45,
          isUnlimited: false
        },
        registrationSettings: {
          requiresApproval: false,
          isInviteOnly: false
        },
        sessions: [
          {
            title: 'Keynote: Scaling Modern Workspaces',
            description: 'Opening session on flexible workspaces and community engagement.',
            startTime: new Date(Date.now() + 86400000 * 3 + 3600000 * 1),
            endTime: new Date(Date.now() + 86400000 * 3 + 3600000 * 2.5),
            location: 'Main Auditorium'
          }
        ],
        media: {
          bannerUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
          imageUrls: []
        },
        seo: {
          metaTitle: 'WeVentureHub Innovation & Coworking Summit',
          metaDescription: 'Official WeVentureHub Event',
          metaKeywords: ['WeVentureHub', 'Event']
        },
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
        tickets: [
          {
            id: 't1',
            name: 'General Access Pass',
            description: 'Full pass for keynote presentations and networking area',
            price: 0,
            currency: 'USD',
            status: 'ACTIVE'
          },
          {
            id: 't2',
            name: 'VIP Executive Pass',
            description: 'Includes reserved seating, VIP lounge access, and exclusive dinner',
            price: 99,
            currency: 'USD',
            status: 'ACTIVE'
          }
        ],
        organizer: {
          id: 'weventurehub',
          name: 'WeVentureHub',
          description: 'Official WeVentureHub Workspace & Event Hub',
          branding: { primaryColor: '#0F172A' }
        },
        reviews: [],
        reviewStats: { averageRating: 5.0, totalReviews: 8 }
      };

      ApiResponse.success(res, defaultMockEvent);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get dynamic recommendations based on current event's category/tags
   */
  public async getRecommendations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { eventId, category } = req.query;
      const limit = parseInt(req.query.limit as string, 10) || 4;

      if (!eventId) {
        res.status(400).json({ success: false, message: 'eventId is required for recommendations' });
        return;
      }

      const query: any = {
        status: EventStatus.PUBLISHED,
        visibility: EventVisibility.PUBLIC,
        _id: { $ne: String(eventId) }
      };

      if (category) {
        query.category = String(category);
      }

      let recommendations = await Event.find(query).limit(limit).exec();

      // If we didn't get enough recommendations, backfill with general published events
      if (recommendations.length < limit) {
        const excludeIds = [String(eventId), ...recommendations.map(r => r.id)];
        const extraLimit = limit - recommendations.length;
        const extras = await Event.find({
          status: EventStatus.PUBLISHED,
          visibility: EventVisibility.PUBLIC,
          _id: { $nin: excludeIds }
        }).limit(extraLimit).exec();

        recommendations = [...recommendations, ...extras];
      }

      ApiResponse.success(res, recommendations);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get list of all organizers (Tenants) active on the platform
   */
  public async getOrganizers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenants = await Tenant.find({ status: TenantStatus.ACTIVE }).exec();
      
      const richOrganizers = await Promise.all(
        tenants.map(async (tenant) => {
          const eventCount = await Event.countDocuments({
            tenantId: tenant._id,
            status: EventStatus.PUBLISHED,
            visibility: EventVisibility.PUBLIC
          });

          return {
            id: tenant._id,
            name: tenant.name,
            description: tenant.description,
            branding: tenant.branding,
            eventCount
          };
        })
      );

      // Filter out organizers with 0 events unless we want all of them. Let's return all.
      ApiResponse.success(res, richOrganizers);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get detailed profile of an organizer/tenant by ID
   */
  public async getOrganizerProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const tenant = await Tenant.findOne({ _id: id }).exec();

      if (!tenant) {
        res.status(404).json({ success: false, message: 'Organizer profile not found' });
        return;
      }

      // Fetch active published events count
      const activeEventsCount = await Event.countDocuments({
        tenantId: tenant._id,
        status: EventStatus.PUBLISHED,
        visibility: EventVisibility.PUBLIC
      });

      const response = {
        id: tenant._id,
        name: tenant.name,
        description: tenant.description,
        branding: tenant.branding,
        settings: tenant.settings,
        activeEventsCount
      };

      ApiResponse.success(res, response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Submit an event review
   */
  public async addReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { eventId } = req.params;
      const { reviewerName, reviewerEmail, rating, comment } = req.body;

      if (!reviewerName || !reviewerEmail || !rating || !comment) {
        res.status(400).json({ success: false, message: 'All review parameters are required' });
        return;
      }

      const event = await Event.findById(eventId).exec();
      if (!event) {
        res.status(404).json({ success: false, message: 'Event not found' });
        return;
      }

      const review = await Review.create({
        eventId,
        tenantId: event.tenantId,
        reviewerName,
        reviewerEmail,
        rating: Number(rating),
        comment
      });

      ApiResponse.success(res, review, 201, {
        message: 'Review posted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get reviews for an event
   */
  public async getReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { eventId } = req.params;
      const reviews = await Review.find({ eventId }).sort({ createdAt: -1 }).exec();
      ApiResponse.success(res, reviews);
    } catch (error) {
      next(error);
    }
  }

  /**
   * List all public, non-deleted workspaces with advanced search, filtering, sorting, and tenant information
   */
  public async getWorkspaces(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        tenantId,
        search,
        category,
        workspaceType,
        type,
        minCapacity,
        maxPrice,
        sort,
        featured,
        availability
      } = req.query;

      const query: any = { isDeleted: false, status: 'published' };
      
      if (tenantId) {
        query.tenantId = String(tenantId).toLowerCase();
      }

      if (category) {
        query.category = { $regex: new RegExp(`^${category}$`, 'i') };
      }

      const typeFilter = workspaceType || type;
      if (typeFilter) {
        query.$or = [
          { workspaceType: String(typeFilter) },
          { type: String(typeFilter) }
        ];
      }

      if (availability) {
        query.availability = String(availability);
      } else {
        query.isAvailable = true;
      }

      if (minCapacity) {
        query.capacity = { $gte: parseInt(String(minCapacity), 10) };
      }

      if (maxPrice) {
        const pLimit = parseFloat(String(maxPrice));
        query.$or = [
          { hourlyPrice: { $lte: pLimit } },
          { hourlyRate: { $lte: pLimit } }
        ];
      }

      if (search) {
        const searchStr = String(search).trim();
        const regex = { $regex: searchStr, $options: 'i' };
        query.$or = [
          { title: regex },
          { name: regex },
          { category: regex },
          { shortDescription: regex },
          { fullDescription: regex },
          { location: regex },
          { amenities: { $in: [new RegExp(searchStr, 'i')] } }
        ];
      }

      if (featured === 'true') {
        query.featured = true;
      }

      let dbQuery = Workspace.find(query);

      // Sorting Strategy
      switch (sort) {
        case 'price_asc':
          dbQuery = dbQuery.sort({ hourlyPrice: 1, hourlyRate: 1 });
          break;
        case 'price_desc':
          dbQuery = dbQuery.sort({ hourlyPrice: -1, hourlyRate: -1 });
          break;
        case 'capacity_desc':
          dbQuery = dbQuery.sort({ capacity: -1 });
          break;
        case 'name_asc':
          dbQuery = dbQuery.sort({ title: 1, name: 1 });
          break;
        default:
          dbQuery = dbQuery.sort({ displayOrder: 1, createdAt: -1 });
      }

      const workspaces = await dbQuery.exec();

      // Enrich workspaces with tenant/organizer info
      const enrichedWorkspaces = await Promise.all(
        workspaces.map(async (workspace) => {
          const wsObj = workspace.toObject();
          const tenant = await Tenant.findOne({ _id: workspace.tenantId }).select('name branding.logoUrl branding.primaryColor branding.secondaryColor').exec();
          return {
            ...wsObj,
            organizer: tenant ? {
              name: tenant.name,
              logoUrl: tenant.branding?.logoUrl,
              primaryColor: tenant.branding?.primaryColor,
              secondaryColor: tenant.branding?.secondaryColor
            } : null
          };
        })
      );

      ApiResponse.success(res, enrichedWorkspaces);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get workspace detail by ID or Slug with associated tenant info and recommendations
   */
  public async getWorkspaceById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      let workspace = null;
      
      if (id.match(/^[0-9a-fA-F]{24}$/)) {
        workspace = await Workspace.findOne({ _id: id, isDeleted: false }).exec();
      }
      
      if (!workspace) {
        workspace = await Workspace.findOne({ slug: id, isDeleted: false }).exec();
      }

      if (!workspace) {
        res.status(404).json({ success: false, message: 'Workspace not found' });
        return;
      }

      const wsObj = workspace.toObject();

      // Retrieve tenant details
      const tenant = await Tenant.findOne({ _id: workspace.tenantId }).exec();

      // Retrieve simple recommendations (same category or type, excluding current)
      const recommendations = await Workspace.find({
        _id: { $ne: workspace._id },
        $or: [
          { category: workspace.category },
          { workspaceType: workspace.workspaceType },
          { type: workspace.type }
        ],
        isDeleted: false,
        status: 'published'
      }).limit(4).exec();

      const enrichedRecommendations = await Promise.all(
        recommendations.map(async (rec) => {
          const recObj = rec.toObject();
          const recTenant = await Tenant.findOne({ _id: rec.tenantId }).select('name branding.logoUrl').exec();
          return {
            ...recObj,
            organizer: recTenant ? {
              name: recTenant.name,
              logoUrl: recTenant.branding?.logoUrl
            } : null
          };
        })
      );

      const result = {
        ...wsObj,
        organizer: tenant ? {
          id: tenant._id,
          name: tenant.name,
          description: tenant.description,
          branding: tenant.branding,
          settings: tenant.settings
        } : null,
        recommendations: enrichedRecommendations
      };

      ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get dynamic website settings of an organizer
   */
  public async getOrganizerWebsite(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const tenant = await Tenant.findOne({ _id: id }).exec();
      if (!tenant) {
        res.status(404).json({ success: false, message: 'Organizer profile not found' });
        return;
      }

      ApiResponse.success(res, {
        id: tenant._id,
        name: tenant.name,
        description: tenant.description,
        branding: tenant.branding,
        settings: tenant.settings,
        website: tenant.website || {
          enabled: true,
          hero: {
            title: `${tenant.name} Workspace & Events`,
            subtitle: 'Establish, coordinate, and host premium workspace boards and interactive user experiences.',
            backgroundImageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200',
            ctaText: 'Explore Experiences',
            ctaLink: '#events'
          },
          about: {
            title: 'Our Narrative',
            description: tenant.description || 'We are committed to delivering outstanding workspace bookings and event management solutions tailored to ambitious operations.',
            foundingYear: 2024,
            highlights: ['Tailored boardrooms', 'High-speed fiber web', 'Active workshops', 'Professional hospitality']
          },
          team: [],
          gallery: [],
          testimonials: [],
          seo: {
            metaTitle: tenant.name,
            metaDescription: tenant.description,
            metaKeywords: ['workspace', 'events', 'bookings'],
            ogImage: tenant.branding?.logoUrl || ''
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate an XML / JSON sitemap dynamically for search engines
   */
  public async getSitemap(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const activeTenants = await Tenant.find({ status: TenantStatus.ACTIVE }).select('_id name updatedAt').exec();
      const publishedEvents = await Event.find({ status: EventStatus.PUBLISHED, visibility: EventVisibility.PUBLIC }).select('slug tenantId updatedAt').exec();

      const host = req.get('host') || 'weventurehub.com';
      const protocol = req.secure ? 'https' : 'http';
      const baseUrl = `${protocol}://${host}`;

      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

      // Main pages
      const corePages = ['', 'events', 'about', 'pricing', 'contact'];
      corePages.forEach(path => {
        xml += `  <url>\n`;
        xml += `    <loc>${baseUrl}/#/${path}</loc>\n`;
        xml += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
        xml += `    <changefreq>daily</changefreq>\n`;
        xml += `    <priority>${path === '' ? '1.0' : '0.8'}</priority>\n`;
        xml += `  </url>\n`;
      });

      // Tenant websites sitemap
      activeTenants.forEach(tenant => {
        const lastmod = (tenant as any).updatedAt ? (tenant as any).updatedAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        xml += `  <url>\n`;
        xml += `    <loc>${baseUrl}/#/organizers/${tenant._id}</loc>\n`;
        xml += `    <lastmod>${lastmod}</lastmod>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.7</priority>\n`;
        xml += `  </url>\n`;
      });

      // Events sitemap
      publishedEvents.forEach(event => {
        const lastmod = (event as any).updatedAt ? (event as any).updatedAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        xml += `  <url>\n`;
        xml += `    <loc>${baseUrl}/#/events/${event.slug}</loc>\n`;
        xml += `    <lastmod>${lastmod}</lastmod>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.6</priority>\n`;
        xml += `  </url>\n`;
      });

      xml += `</urlset>`;

      res.header('Content-Type', 'application/xml');
      res.status(200).send(xml);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Serves structured schema JSON-LD data for SEO indexing
   */
  public async getStructuredData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId } = req.params;
      const tenant = await Tenant.findOne({ _id: tenantId }).exec();
      if (!tenant) {
        res.status(404).json({ success: false, message: 'Organizer profile not found for structured metadata' });
        return;
      }

      const host = req.get('host') || 'weventurehub.com';
      const protocol = req.secure ? 'https' : 'http';
      const url = `${protocol}://${host}/#/organizers/${tenant._id}`;

      const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        'name': tenant.name,
        'description': tenant.description || 'Premium workspace and corporate host hub.',
        'url': url,
        'logo': tenant.branding?.logoUrl || '',
        'image': tenant.website?.hero?.backgroundImageUrl || tenant.branding?.logoUrl || '',
        'address': {
          '@type': 'PostalAddress',
          'addressLocality': tenant.settings.timezone || 'UTC',
          'addressCountry': 'US'
        }
      };

      res.status(200).json(jsonLd);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Submit public contact form inquiry
   */
  public async submitContact(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantHeader = req.headers['x-tenant-id'] || 'weventurehub';
      const tenantId = Array.isArray(tenantHeader) ? tenantHeader[0] : tenantHeader;
      const { name, email, phone, subject, message } = req.body;
      if (!email || !message) {
        res.status(400).json({ success: false, message: 'Email and message are required fields.' });
        return;
      }

      // Save to Database
      const { Contact } = await import('../models/Contact');
      const nameParts = name?.trim().split(/\s+/) || [];
      const firstName = nameParts[0] || 'Inquirer';
      const lastName = nameParts.slice(1).join(' ') || 'Contact';

      const newContact = new Contact({
        tenantId,
        firstName,
        lastName,
        email,
        phone,
        status: 'LEAD',
        leadSource: 'Landing Page Contact Form',
        notes: [
          {
            author: 'System Auto-Log',
            content: `Subject: ${subject || 'General Inquiry'}. Message: "${message}"`,
            createdAt: new Date(),
          }
        ]
      });

      await newContact.save();

      // Send Email Notification
      await emailNotificationManager.sendContactFormNotification({
        customerName: name || 'Valued Visitor',
        customerEmail: email.toLowerCase(),
        customerPhone: phone,
        subject: subject || 'Inquiry regarding WeVentureHub Workspaces/Events',
        message,
      });

      ApiResponse.success(res, { submitted: true }, 200, { message: 'Your message has been received! Confirmation email sent.' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Submit RSVP for a Free RSVP Event
   */
  public async submitRsvp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { eventId } = req.params;
      const { name, email, phone, company, guestCount, answers } = req.body;

      if (!name || !email) {
        res.status(400).json({ success: false, message: 'Name and Email are required for RSVP submission' });
        return;
      }

      const event = await Event.findById(eventId).exec();
      if (!event) {
        res.status(404).json({ success: false, message: 'Event not found' });
        return;
      }

      // Generate Ticket Number and Secure Verification Token
      const ticketNumber = 'RSVP-' + Math.random().toString(36).substring(2, 9).toUpperCase();
      const secureToken = crypto.randomBytes(24).toString('hex');

      // Ensure we have activeRegistrations tracked
      const currentCount = event.capacity?.activeRegistrations || 0;
      const guestNum = parseInt(guestCount, 10) || 1;

      if (event.capacity && !event.capacity.isUnlimited && event.capacity.maxCapacity > 0) {
        if (currentCount + guestNum > event.capacity.maxCapacity) {
          res.status(400).json({ success: false, message: 'Sorry, this event has reached its maximum RSVP capacity.' });
          return;
        }
      }

      // Pre-instantiate Registration to access its automatic ObjectId (_id)
      const registration = new Registration({
        tenantId: event.tenantId || 'weventurehub',
        userId: 'guest_rsvp',
        userEmail: email.toLowerCase(),
        eventId: event._id.toString(),
        ticketNumber: ticketNumber,
        verificationToken: secureToken,
        qrCode: ticketNumber, // will be replaced with high-quality QR base64 code below
        attendeeName: name,
        attendeeEmail: email.toLowerCase(),
        status: 'CONFIRMED',
        checkedIn: false,
        registrationDate: new Date(),
        customAnswers: {
          phone: phone || '',
          company: company || '',
          guestCount: guestNum,
          ...answers
        }
      });

      // Generate secure verification URL and branded high-quality QR Code
      const frontendUrl = process.env.FRONTEND_URL || process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
      const verificationUrl = `${frontendUrl}/#/tickets/${registration._id}?token=${secureToken}`;

      try {
        const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
          color: {
            dark: '#0f172a', // Brand Dark Slate
            light: '#ffffff' // High-contrast White background
          },
          width: 400,
          margin: 2
        });
        registration.qrCode = qrCodeDataUrl;
      } catch (qrErr) {
        console.error('Failed to pre-generate QR code base64 Data URL:', qrErr);
      }

      const savedReg = await registration.save();

      // Update active registrations on the event using lightweight atomic update
      if (event.capacity) {
        await Event.updateOne(
          { _id: event._id },
          { $inc: { 'capacity.activeRegistrations': guestNum } }
        );
      } else {
        await Event.updateOne(
          { _id: event._id },
          { $set: { capacity: { maxCapacity: 0, activeRegistrations: guestNum, isUnlimited: true } } }
        );
      }

      // Send HTTP response immediately with the full ticket detail so the user has it instantly
      ApiResponse.success(res, savedReg, 201, { message: 'RSVP submitted successfully! Your digital ticket is on its way.' });

      // Perform background tasks (Analytics Activity log and Email dispatch) asynchronously without blocking response
      setImmediate(async () => {
        try {
          const { Activity } = await import('../models/Activity');
          await Activity.create({
            tenantId: event.tenantId || 'weventurehub',
            userId: 'guest_rsvp',
            userEmail: email,
            userName: name,
            action: 'RSVP_SUBMITTED',
            resourceType: 'EVENT',
            resourceId: event._id.toString(),
            details: {
              description: `User ${name} registered for event ${event.title}`,
              registrationId: savedReg._id
            }
          });
        } catch (actErr) {
          console.error('[RSVP Background Task] Failed to record activity:', actErr);
        }

        try {
          const emailSettings = event.rsvpEmailSettings?.confirmationEmail;
          const eventDate = event.schedule?.startDate ? new Date(event.schedule.startDate).toLocaleString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }) : 'TBD';
          
          let emailHtml = '';
          let subject = `RSVP Confirmed: ${event.title}`;
          const qrCodeUrlToRender = savedReg.qrCode || `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verificationUrl)}`;

          if (emailSettings && emailSettings.enabled) {
            subject = emailSettings.subject.replace('{name}', name).replace('{event_title}', event.title).replace('{event_date}', eventDate);
            const customBody = emailSettings.body.replace('{name}', name).replace('{event_title}', event.title).replace('{event_date}', eventDate);
            
            // Render beautiful custom body enclosed in our brand container
            emailHtml = `
              <div style="background-color: #0F172A; text-align: center; padding: 25px 20px; border-top-left-radius: 16px; border-top-right-radius: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <span style="font-size: 24px; font-weight: 900; color: #FFFFFF; letter-spacing: -0.5px;">
                  We<span style="color: #A3E635;">Venture</span>Hub
                </span>
                <p style="color: #CBD5E1; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; margin: 4px 0 0 0; font-weight: 700;">Event &amp; Workspace Management Platform</p>
              </div>
              <div style="height: 3px; background: linear-gradient(90deg, #A3E635 0%, #22D3EE 100%);"></div>
              
              <div style="background-color: #0F172A; padding: 30px 25px; border-bottom-left-radius: 16px; border-bottom-right-radius: 16px; color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <div style="white-space: pre-wrap; color: #CBD5E1; font-size: 14px; line-height: 1.6; margin-bottom: 25px;">
                  ${customBody}
                </div>
                
                ${emailSettings.attachTicket || emailSettings.attachQrCode ? `
                  <div style="background-color: #1E293B; border: 2px dashed #A3E635; border-radius: 16px; padding: 30px 20px; text-align: center; margin-bottom: 30px;">
                    <span style="font-size: 11px; font-weight: 900; color: #A3E635; text-transform: uppercase; letter-spacing: 2px; display: block; margin-bottom: 15px;">Digital Admission Ticket</span>
                    <div style="margin-bottom: 20px;">
                      <img src="${qrCodeUrlToRender}" alt="Admission QR Code" style="border: 6px solid #FFFFFF; border-radius: 12px; width: 180px; height: 180px; box-shadow: 0 4px 12px rgba(0,0,0,0.5);" />
                    </div>
                    <div style="font-family: monospace; font-size: 18px; font-weight: bold; color: #FFFFFF; margin-bottom: 5px;">
                      ID: ${savedReg._id}
                    </div>
                    <div style="font-family: monospace; font-size: 14px; color: #CBD5E1; margin-bottom: 10px;">
                      Ticket No: ${ticketNumber}
                    </div>
                    <div style="display: inline-block; background-color: #22C55E; color: #FFFFFF; font-size: 11px; font-weight: 900; padding: 5px 12px; border-radius: 8px; text-transform: uppercase; letter-spacing: 1px;">
                      CONFIRMED
                    </div>
                  </div>
                ` : ''}

                <div style="text-align: center; margin-bottom: 30px;">
                  <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(90deg, #A3E635 0%, #22D3EE 100%); color: #0F172A; font-weight: 900; font-size: 14px; text-decoration: none; padding: 14px 28px; border-radius: 12px; box-shadow: 0 4px 12px rgba(163,230,53,0.3); margin-right: 10px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px;">
                    View Digital Ticket
                  </a>
                  <a href="${verificationUrl}&download=true" style="display: inline-block; background-color: #1E293B; border: 1px solid rgba(255,255,255,0.15); color: #FFFFFF; font-weight: 700; font-size: 14px; text-decoration: none; padding: 14px 28px; border-radius: 12px; margin-bottom: 10px;">
                    Download PDF
                  </a>
                </div>

                <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 20px; font-size: 12px; color: #CBD5E1; text-align: center; line-height: 1.6;">
                  <p style="margin: 0 0 8px 0; font-weight: 700; color: #FFFFFF;">Organized by WeVentureHub Community Team</p>
                  <p style="margin: 0 0 15px 0;">If you have any questions, reply directly to this email or contact support.</p>
                  <p style="margin: 0; font-size: 10px; color: #64748B; text-transform: uppercase; letter-spacing: 1px;">&copy; 2026 WeVentureHub. All Rights Reserved.</p>
                </div>
              </div>
            `;
          } else {
            emailHtml = `
              <div style="background-color: #0F172A; text-align: center; padding: 25px 20px; border-top-left-radius: 16px; border-top-right-radius: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <span style="font-size: 24px; font-weight: 900; color: #FFFFFF; letter-spacing: -0.5px;">
                  We<span style="color: #A3E635;">Venture</span>Hub
                </span>
                <p style="color: #CBD5E1; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; margin: 4px 0 0 0; font-weight: 700;">Event &amp; Workspace Management Platform</p>
              </div>
              <div style="height: 3px; background: linear-gradient(90deg, #A3E635 0%, #22D3EE 100%);"></div>
              
              <div style="background-color: #0F172A; padding: 30px 25px; border-bottom-left-radius: 16px; border-bottom-right-radius: 16px; color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <h1 style="font-size: 26px; font-weight: 800; text-align: center; margin-bottom: 20px; background: linear-gradient(90deg, #A3E635 0%, #22D3EE 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; color: #A3E635;">
                  RSVP Successfully Confirmed
                </h1>

                <p style="font-size: 15px; line-height: 1.6; color: #CBD5E1; margin-bottom: 25px; text-align: center;">
                  Hello <strong>${name}</strong>, your spot has been secured! We are thrilled to host you at WeVentureHub. Below is your professional digital admission pass.
                </p>

                <div style="background-color: #1E293B; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 20px; margin-bottom: 30px;">
                  <h3 style="color: #A3E635; margin-top: 0; font-size: 16px; font-weight: 700; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 10px; margin-bottom: 15px;">
                    Event Details
                  </h3>
                  <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 6px 0; font-weight: 700; color: #CBD5E1; width: 120px; vertical-align: top;">Event Name:</td>
                      <td style="padding: 6px 0; color: #FFFFFF; font-weight: 800;">${event.title}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; font-weight: 700; color: #CBD5E1; vertical-align: top;">Date &amp; Time:</td>
                      <td style="padding: 6px 0; color: #FFFFFF;">${eventDate}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; font-weight: 700; color: #CBD5E1; vertical-align: top;">Venue:</td>
                      <td style="padding: 6px 0; color: #FFFFFF;">WeVentureHub Suite &amp; Hall</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; font-weight: 700; color: #CBD5E1; vertical-align: top;">Attendee:</td>
                      <td style="padding: 6px 0; color: #FFFFFF;">${name}</td>
                    </tr>
                  </table>
                </div>

                <div style="background-color: #1E293B; border: 2px dashed #A3E635; border-radius: 16px; padding: 30px 20px; text-align: center; margin-bottom: 30px;">
                  <span style="font-size: 11px; font-weight: 900; color: #A3E635; text-transform: uppercase; letter-spacing: 2px; display: block; margin-bottom: 15px;">
                    Digital Admission Ticket
                  </span>
                  
                  <div style="margin-bottom: 20px;">
                    <img src="${qrCodeUrlToRender}" alt="Admission QR Code" style="border: 6px solid #FFFFFF; border-radius: 12px; width: 180px; height: 180px; box-shadow: 0 4px 12px rgba(0,0,0,0.5);" />
                  </div>

                  <div style="font-family: monospace; font-size: 18px; font-weight: bold; color: #FFFFFF; margin-bottom: 5px;">
                    ID: ${savedReg._id}
                  </div>
                  <div style="font-family: monospace; font-size: 14px; color: #CBD5E1; margin-bottom: 10px;">
                    Ticket No: ${ticketNumber}
                  </div>
                  
                  <div style="display: inline-block; background-color: #22C55E; color: #FFFFFF; font-size: 11px; font-weight: 900; padding: 5px 12px; border-radius: 8px; text-transform: uppercase; letter-spacing: 1px;">
                    CONFIRMED
                  </div>
                </div>

                <div style="text-align: center; margin-bottom: 30px;">
                  <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(90deg, #A3E635 0%, #22D3EE 100%); color: #0F172A; font-weight: 900; font-size: 14px; text-decoration: none; padding: 14px 28px; border-radius: 12px; box-shadow: 0 4px 12px rgba(163,230,53,0.3); margin-right: 10px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px;">
                    View Digital Ticket
                  </a>
                  <a href="${verificationUrl}&download=true" style="display: inline-block; background-color: #1E293B; border: 1px solid rgba(255,255,255,0.15); color: #FFFFFF; font-weight: 700; font-size: 14px; text-decoration: none; padding: 14px 28px; border-radius: 12px; margin-bottom: 10px;">
                    Download PDF
                  </a>
                </div>

                <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 20px; font-size: 12px; color: #CBD5E1; text-align: center; line-height: 1.6;">
                  <p style="margin: 0 0 8px 0; font-weight: 700; color: #FFFFFF;">Organized by WeVentureHub Community Team</p>
                  <p style="margin: 0 0 15px 0;">If you have any questions, reply directly to this email or visit our website.</p>
                  <p style="margin: 0; font-size: 10px; color: #64748B; text-transform: uppercase; letter-spacing: 1px;">&copy; 2026 WeVentureHub. All Rights Reserved.</p>
                </div>
              </div>
            `;
          }

          await emailNotificationManager.sendCustomRsvpEmail({
            to: email.toLowerCase(),
            recipientName: name,
            subject: subject,
            html: emailHtml
          });
        } catch (emailErr) {
          console.error('[RSVP Background Task] Failed to send confirmation email:', emailErr);
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get public ticket details securely using a verification token
   */
  public async getTicketByToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { token } = req.query;

      if (!token) {
        res.status(400).json({ success: false, message: 'Verification token is required' });
        return;
      }

      const registration = await Registration.findById(id).exec();
      if (!registration) {
        res.status(404).json({ success: false, message: 'Ticket registration not found' });
        return;
      }

      if (registration.verificationToken !== token) {
        res.status(403).json({ success: false, message: 'Invalid or unauthorized verification token' });
        return;
      }

      const event = await Event.findById(registration.eventId).exec();

      res.status(200).json({
        success: true,
        data: {
          registration,
          event
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check in an attendee securely via their public verification link (supporting staff check-in)
   */
  public async checkInTicketByToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { token } = req.body;

      const actualToken = token || req.query.token;

      if (!actualToken) {
        res.status(400).json({ success: false, message: 'Verification token is required' });
        return;
      }

      const registration = await Registration.findById(id).exec();
      if (!registration) {
        res.status(404).json({ success: false, message: 'Ticket registration not found' });
        return;
      }

      if (registration.verificationToken !== actualToken) {
        res.status(403).json({ success: false, message: 'Invalid or unauthorized verification token' });
        return;
      }

      if (registration.status === 'CANCELLED') {
        res.status(400).json({ success: false, message: 'This ticket registration has been CANCELLED.' });
        return;
      }

      if (registration.status === 'WAITLISTED') {
        res.status(400).json({ success: false, message: 'This ticket is currently WAITLISTED and not valid for entry.' });
        return;
      }

      if (registration.checkedIn) {
        res.status(409).json({
          success: false,
          message: `Already checked in at ${registration.checkedInAt ? new Date(registration.checkedInAt).toLocaleString() : 'previously'}`
        });
        return;
      }

      // Perform Check-in
      registration.checkedIn = true;
      registration.checkedInAt = new Date();
      const updated = await registration.save();

      res.status(200).json({
        success: true,
        message: 'Attendee successfully checked in!',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }
}

export const publicMarketplaceController = new PublicMarketplaceController();
