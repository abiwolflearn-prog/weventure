import mongoose from 'mongoose';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { Workspace } from '../models/Workspace';
import { EventCategory } from '../models/EventCategory';
import { Sponsor } from '../models/Sponsor';
import { Partner } from '../models/Partner';
import { Testimonial } from '../models/Testimonial';
import { News } from '../models/News';
import { Homepage } from '../models/Homepage';
import { Event } from '../models/Event';
import { EventStatus, EventVisibility } from '../types';
import { MongoMemoryServer } from 'mongodb-memory-server';

interface IMongoConnectionOptions {
  autoIndex: boolean;
  maxPoolSize: number;
  serverSelectionTimeoutMS: number;
}

const defaultOptions: IMongoConnectionOptions = {
  autoIndex: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
};

let mongoServer: MongoMemoryServer | null = null;

export async function connectDatabase(): Promise<typeof mongoose> {
  let uri = env.MONGODB_URI;

  if (env.NODE_ENV !== 'production' && (uri.includes('127.0.0.1:27017') || uri.includes('localhost:27017'))) {
    logger.info('💾 Local/default MongoDB connection requested. Spawning embedded MongoMemoryServer fallback...');
    try {
      mongoServer = await MongoMemoryServer.create();
      uri = mongoServer.getUri();
      logger.info(`💾 Embedded MongoMemoryServer running successfully at: ${uri}`);
    } catch (err) {
      logger.error('❌ Failed to start embedded MongoMemoryServer, attempting direct connection anyway', err);
    }
  } else if (env.NODE_ENV === 'production' && (uri.includes('127.0.0.1:27017') || uri.includes('localhost:27017'))) {
    throw new Error('❌ Localhost MongoDB connection is strictly prohibited in production mode');
  }

  mongoose.connection.on('connected', () => {
    logger.info('🔌 Mongoose connected to MongoDB database successfully');
  });

  mongoose.connection.on('error', (err) => {
    logger.error('❌ Mongoose database connection error', err);
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('🔌 Mongoose disconnected from MongoDB database');
  });

  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    if (mongoServer) {
      await mongoServer.stop();
    }
    logger.info('🔌 Mongoose connection terminated via application shutdown (SIGINT)');
    process.exit(0);
  });

  try {
    logger.info(`🔄 Initiating connection to MongoDB: ${uri.split('@')[1] || uri}`);
    const conn = await mongoose.connect(uri, defaultOptions);

    // Auto-seed workspaces if none exist
    try {
      const count = await Workspace.countDocuments();
      if (count === 0) {
        await Workspace.create([
          {
            tenantId: 'weventurehub',
            name: 'Tesla Boardroom',
            type: 'MEETING_ROOM',
            capacity: 12,
            hourlyRate: 45.00,
            currency: 'USD',
            amenities: ['TV Screen', 'Whiteboard', 'Webcam', 'Conference Phone'],
            isAvailable: true,
            availabilityRules: { startHour: 8, endHour: 20, allowedDays: [1, 2, 3, 4, 5] },
            bufferTime: 15,
          },
          {
            tenantId: 'weventurehub',
            name: 'Silicon Valley Desk 12',
            type: 'HOT_DESK',
            capacity: 1,
            hourlyRate: 5.00,
            currency: 'USD',
            amenities: ['Ethernet', 'Ergonomic Chair', 'Power Outlets'],
            isAvailable: true,
            availabilityRules: { startHour: 0, endHour: 24, allowedDays: [0, 1, 2, 3, 4, 5, 6] },
            bufferTime: 0,
          },
          {
            tenantId: 'weventurehub',
            name: 'Amphitheater Hall',
            type: 'EVENT_VENUE',
            capacity: 150,
            hourlyRate: 120.00,
            currency: 'USD',
            amenities: ['PA System', 'Projector', 'Stage', 'Mic Arrays'],
            isAvailable: true,
            availabilityRules: { startHour: 8, endHour: 22, allowedDays: [0, 1, 2, 3, 4, 5, 6] },
            bufferTime: 60,
          },
          {
            tenantId: 'weventurehub',
            name: 'Turing Meeting Suite',
            type: 'MEETING_ROOM',
            capacity: 8,
            hourlyRate: 35.00,
            currency: 'USD',
            amenities: ['Whiteboard', 'Webcam', 'Sound Isolation'],
            isAvailable: true,
            availabilityRules: { startHour: 8, endHour: 20, allowedDays: [1, 2, 3, 4, 5] },
            bufferTime: 15,
          },
          {
            tenantId: 'weventurehub',
            name: 'Ada Lovelace Tech Pod',
            type: 'HOT_DESK',
            capacity: 1,
            hourlyRate: 6.00,
            currency: 'USD',
            amenities: ['Ethernet', 'Dual Monitor', 'Type-C Hub'],
            isAvailable: true,
            availabilityRules: { startHour: 0, endHour: 24, allowedDays: [0, 1, 2, 3, 4, 5, 6] },
            bufferTime: 0,
          }
        ]);
        logger.info('🌱 Successfully seeded default enterprise workspaces into MongoDB');
      }

      // 2. Seed Event Categories
      const categoryCount = await EventCategory.countDocuments();
      if (categoryCount === 0) {
        await EventCategory.create([
          { name: 'Technology & AI', slug: 'tech-ai', description: 'Advanced programming, artificial intelligence, and developer accelerators.' },
          { name: 'Business & Startup Strategy', slug: 'startup-strategy', description: 'Venture scaling, investor pitch, and startup workshops.' },
          { name: 'Design & Product UX', slug: 'design-ux', description: 'Aesthetic composition, user experience design, and design-system hackathons.' },
          { name: 'Community Workshops', slug: 'community', description: 'Networking, startup mixers, and peer mentorship.' }
        ]);
        logger.info('🌱 Seeded default Event Categories');
      }

      // 3. Seed Sponsors
      const sponsorCount = await Sponsor.countDocuments();
      if (sponsorCount === 0) {
        await Sponsor.create([
          { name: 'Ethiopian Airlines', logoUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&q=80&w=200', websiteUrl: 'https://www.ethiopianairlines.com', tier: 'Platinum' },
          { name: 'Safarisom', logoUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=200', websiteUrl: 'https://www.safaricom.co.et', tier: 'Platinum' },
          { name: 'Commercial Bank of Ethiopia', logoUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=200', websiteUrl: 'https://www.combanketh.et', tier: 'Gold' },
          { name: 'Awash Bank', logoUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&q=80&w=200', websiteUrl: 'https://awashbank.com', tier: 'Gold' },
          { name: 'Dashen Bank', logoUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&q=80&w=200', websiteUrl: 'https://dashenbanksc.com', tier: 'Silver' }
        ]);
        logger.info('🌱 Seeded Sponsors');
      }

      // 4. Seed Partners
      const partnerCount = await Partner.countDocuments();
      if (partnerCount === 0) {
        await Partner.create([
          { name: 'Ministry of Innovation & Tech (MInT)', logoUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=200', websiteUrl: 'https://mint.gov.et', type: 'Government' },
          { name: 'Addis Ababa University', logoUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=200', websiteUrl: 'http://www.aau.edu.et', type: 'Academic' },
          { name: 'YeneTech Incubator', logoUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=200', websiteUrl: '#', type: 'Technology' },
          { name: 'VentureAddis Capital', logoUrl: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=200', websiteUrl: '#', type: 'Venture' }
        ]);
        logger.info('🌱 Seeded Partners');
      }

      // 5. Seed Testimonials
      const testimonialCount = await Testimonial.countDocuments();
      if (testimonialCount === 0) {
        await Testimonial.create([
          { authorName: 'Selam Kebede', authorRole: 'Co-Founder', authorCompany: 'YeneFlow AI', content: 'WeVentureHub has changed how we build. The private office space is top tier, and we raised our pre-seed right after our demo day at the event hall!', rating: 5, isFeatured: true },
          { authorName: 'Michael Demissie', authorRole: 'Senior iOS Engineer', authorCompany: 'Chapa Pay', content: 'The dedicated desks are clean, ergonomic, and have high-fidelity fiber connection. Having automatic check-ins via QR codes makes it super professional.', rating: 5, isFeatured: true },
          { authorName: 'Eleni Gebremedhin', authorRole: 'Program Manager', authorCompany: 'VentureLabs', content: 'The Meeting Rooms have amazing screens and soundbars. Prevent double bookings means we run investor board meetings without any scheduling conflicts.', rating: 5, isFeatured: true }
        ]);
        logger.info('🌱 Seeded Testimonials');
      }

      // 6. Seed News
      const newsCount = await News.countDocuments();
      if (newsCount === 0) {
        await News.create([
          {
            tenantId: 'weventurehub',
            title: 'WeVentureHub Launches 10M Birr Startup Accelerator Fund',
            slug: 'weventurehub-launches-10m-birr-startup-accelerator-fund',
            content: 'We are thrilled to announce WeVentureHub is opening applications for its inaugural 10,000,000 ETB Startup Accelerator Fund. Our cohort will receive direct equity investments, free private suites for 6 months, and dedicated technical mentor workshops to refine their systems.\n\nApplications open on August 1st and close on September 15th, 2026. This fund is supported by Chapa Payments, Safaricom, and the Ministry of Innovation.',
            category: 'Startup Stories',
            imageUrl: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&q=80&w=800',
            tags: ['funding', 'accelerator', 'startups', 'ethiopia'],
            isPublished: true,
            author: 'WeVentureHub Editorial'
          },
          {
            tenantId: 'weventurehub',
            title: 'Safaricom and WeVentureHub Partner for 5G Coworking Network Integration',
            slug: 'safaricom-weventurehub-5g-coworking-partnership',
            content: 'WeVentureHub is officially integrating high-fidelity Safaricom 5G arrays across all our physical coworking structures and training offices. This ensures speeds exceeding 1 Gbps, allowing technical builders and machine learning teams to train neural networks and stream content with near-zero latency.',
            category: 'Innovation Updates',
            imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800',
            tags: ['5G', 'internet', 'safaricom', 'tech-updates'],
            isPublished: true,
            author: 'Biniam Tesfaye'
          },
          {
            tenantId: 'weventurehub',
            title: 'WeVentureHub Ethiopia Community Meetup Highlights',
            slug: 'ethiopia-community-meetup-highlights-2026',
            content: 'Last night over 150 local software engineers, design-system authors, and seed fund directors gathered in our Amphitheater Hall. Highlights included pitches from 5 pre-incubation teams and an open fire chat with local tech executives on navigating Ethiopian regulatory frameworks.',
            category: 'Community News',
            imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=800',
            tags: ['meetup', 'networking', 'community'],
            isPublished: true,
            author: 'WeVentureHub Editorial'
          }
        ]);
        logger.info('🌱 Seeded News and Blog stories');
      }

      // 7. Seed Homepage Config
      const homepageCount = await Homepage.countDocuments();
      if (homepageCount === 0) {
        await Homepage.create({
          tenantId: 'weventurehub',
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
            { title: 'Silicon Addis Incubation', description: 'A intensive 12-week program for pre-product startup teams in Addis Ababa. Includes 100K Birr grant and mentorship.', duration: '12 Weeks', cohortSize: 8, ctaText: 'Apply Cohort' },
            { title: 'AI Engineering Mastery', description: 'Advanced training on deep learning, prompt engineering, and LLM orchestration.', duration: '6 Weeks', cohortSize: 20, ctaText: 'Join Mastery Program' }
          ]
        });
        logger.info('🌱 Seeded Homepage configs');
      }

      // 8. Seed Default Events (Grouped by status)
      const eventCount = await Event.countDocuments();
      if (eventCount === 0) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 15);

        const farFutureDate = new Date();
        farFutureDate.setDate(farFutureDate.getDate() + 30);

        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 10);

        const pastEndDate = new Date();
        pastEndDate.setDate(pastEndDate.getDate() - 9);

        const ongoingStart = new Date();
        ongoingStart.setHours(ongoingStart.getHours() - 2);

        const ongoingEnd = new Date();
        ongoingEnd.setHours(ongoingEnd.getHours() + 4);

        await Event.create([
          {
            tenantId: 'weventurehub',
            title: 'Ethiopia Startup Venture Summit 2026',
            slug: 'ethiopia-startup-venture-summit-2026',
            description: 'Join over 500 tech entrepreneurs, corporate innovators, and venture capital investors at the WeVentureHub. Featuring 3 tracks: Fintech Innovation, AI Accelerators, and Sustainable Agrotech. This is the official hub of startup ecosystems in Ethiopia.',
            status: EventStatus.PUBLISHED,
            visibility: EventVisibility.PUBLIC,
            category: 'Business & Startup Strategy',
            tags: ['summit', 'startups', 'investors', 'featured'],
            schedule: {
              startDate: futureDate,
              endDate: farFutureDate,
              timezone: 'Africa/Addis_Ababa'
            },
            capacity: {
              maxCapacity: 300,
              activeRegistrations: 142,
              isUnlimited: false
            },
            registrationSettings: {
              requiresApproval: false,
              customFormFields: [
                { id: 'startup_name', label: 'Company/Startup Name', type: 'text', required: true }
              ]
            },
            media: {
              bannerUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=800',
              imageUrls: ['https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=800']
            },
            createdBy: 'system'
          },
          {
            tenantId: 'weventurehub',
            title: 'AI & Large Language Model Hackathon',
            slug: 'ai-llm-hackathon-addis-2026',
            description: 'Build fully functional full-stack applications powered by Gemini models and other open AI frameworks. Mentors from WeVentureHub partners and Chapa engineers will guide your backend schemas. Winning teams will receive cash grants and free hub access.',
            status: EventStatus.PUBLISHED,
            visibility: EventVisibility.PUBLIC,
            category: 'Technology & AI',
            tags: ['ai', 'hackathon', 'coding', 'featured'],
            schedule: {
              startDate: ongoingStart,
              endDate: ongoingEnd,
              timezone: 'Africa/Addis_Ababa'
            },
            capacity: {
              maxCapacity: 80,
              activeRegistrations: 78,
              isUnlimited: false
            },
            registrationSettings: {
              requiresApproval: true,
              customFormFields: [
                { id: 'github', label: 'GitHub Handle', type: 'text', required: true }
              ]
            },
            media: {
              bannerUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=800',
              imageUrls: ['https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=800']
            },
            createdBy: 'system'
          },
          {
            tenantId: 'weventurehub',
            title: 'UX Design System Intensive Workshop',
            slug: 'ux-design-system-intensive-2026',
            description: 'A deep-dive session on crafting modern, professional interfaces. We will study custom typography pairings, negative margins, high-contrast layouts, and responsive Tailwind UI grids. Perfect for front-end developers and graphic designers.',
            status: EventStatus.PUBLISHED,
            visibility: EventVisibility.PUBLIC,
            category: 'Design & Product UX',
            tags: ['ux', 'tailwind', 'design', 'upcoming'],
            schedule: {
              startDate: new Date(Date.now() + 86400 * 1000 * 5), // 5 days from now
              endDate: new Date(Date.now() + 86400 * 1000 * 5 + 3 * 3600 * 1000),
              timezone: 'Africa/Addis_Ababa'
            },
            capacity: {
              maxCapacity: 40,
              activeRegistrations: 12,
              isUnlimited: false
            },
            registrationSettings: {
              requiresApproval: false
            },
            media: {
              bannerUrl: 'https://images.unsplash.com/photo-1581291518655-9523c932dedf?auto=format&fit=crop&q=80&w=800',
              imageUrls: ['https://images.unsplash.com/photo-1581291518655-9523c932dedf?auto=format&fit=crop&q=80&w=800']
            },
            createdBy: 'system'
          },
          {
            tenantId: 'weventurehub',
            title: 'Annual Addis Tech Founders Meetup (Past)',
            slug: 'annual-addis-tech-founders-meetup-past',
            description: 'Our annual closed-door fireside networking event. We celebrated high-growth startups, shared operational frameworks, and hosted regulatory discussions.',
            status: EventStatus.PUBLISHED,
            visibility: EventVisibility.PUBLIC,
            category: 'Community Workshops',
            tags: ['founders', 'networking', 'completed'],
            schedule: {
              startDate: pastDate,
              endDate: pastEndDate,
              timezone: 'Africa/Addis_Ababa'
            },
            capacity: {
              maxCapacity: 150,
              activeRegistrations: 150,
              isUnlimited: false
            },
            registrationSettings: {
              requiresApproval: false
            },
            media: {
              bannerUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=800',
              imageUrls: ['https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=800']
            },
            createdBy: 'system'
          }
        ]);
        logger.info('🌱 Seeded status-grouped events');
      }
    } catch (seedErr) {
      logger.error('⚠️ Seeding failed:', seedErr);
    }

    return conn;
  } catch (error) {
    logger.error('❌ Failed to establish initial database connection', error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    logger.info('🔌 Database connection closed successfully');
  }
  if (mongoServer) {
    await mongoServer.stop();
    logger.info('💾 Embedded MongoMemoryServer stopped successfully');
    mongoServer = null;
  }
}
