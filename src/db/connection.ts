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
  mongoose.set('bufferCommands', false);
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

    // Auto-seed workspaces if none exist or if legacy test data exists
    try {
      const count = await Workspace.countDocuments({ isDeleted: false });
      const firstWs = await Workspace.findOne({ isDeleted: false });
      // If no workspaces or legacy incomplete workspaces, re-seed full demo set
      if (count === 0 || (firstWs && !firstWs.title)) {
        if (count > 0 && firstWs && !firstWs.title) {
          await Workspace.deleteMany({});
        }
        await Workspace.create([
          {
            tenantId: 'weventurehub',
            title: 'Innovation Hub',
            name: 'Innovation Hub',
            slug: 'innovation-hub',
            shortDescription: 'Open collaboration & brainstorming lounge with flexible hot desks and gigabit fiber internet.',
            fullDescription: 'Designed for creative thinkers, remote workers, and agile innovators. The Innovation Hub offers flexible open seating, continuous espresso service, ergonomic furniture, and high-speed fiber connectivity in a vibrant atmosphere.',
            category: 'Hot Desk',
            workspaceType: 'HOT_DESK',
            type: 'HOT_DESK',
            capacity: 1,
            floor: 'Floor 1',
            size: '1200 sq ft',
            hourlyPrice: 6.00,
            hourlyRate: 6.00,
            dailyPrice: 35.00,
            dailyRate: 35.00,
            weeklyPrice: 180.00,
            monthlyPrice: 600.00,
            currency: 'USD',
            coverImage: 'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&q=80&w=800',
            imageUrl: 'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&q=80&w=800',
            galleryImages: [
              'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&q=80&w=800',
              'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800',
              'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=800'
            ],
            amenities: ['WiFi', 'Coffee', 'Printer', 'AC', 'Locker', 'Ergonomic Chair'],
            features: ['Gigabit Fiber Internet', '24/7 Access for Members', 'Free Espresso & Tea Bar', 'Phone Booth Access'],
            availability: 'Available',
            isAvailable: true,
            openingHours: '00:00',
            closingHours: '24:00',
            location: 'Building A, Floor 1',
            mapLocation: 'Main Atrium North Wing',
            status: 'published',
            featured: true,
            displayOrder: 1,
            rating: 4.9,
            totalReviews: 38,
            availabilityRules: { startHour: 0, endHour: 24, allowedDays: [0, 1, 2, 3, 4, 5, 6] },
            bufferTime: 0,
          },
          {
            tenantId: 'weventurehub',
            title: 'Executive Office',
            name: 'Executive Office',
            slug: 'executive-office',
            shortDescription: 'High-end private corner office with panoramic views, mahogany desk, and executive lounge.',
            fullDescription: 'A premium private suite tailored for corporate executives, partner meetings, and confidential business consultations. Features floor-to-ceiling city views, soundproofing, executive leather armchairs, and dedicated receptionist support.',
            category: 'Private Office',
            workspaceType: 'PRIVATE_OFFICE',
            type: 'PRIVATE_OFFICE',
            capacity: 4,
            floor: 'Floor 5',
            size: '450 sq ft',
            hourlyPrice: 55.00,
            hourlyRate: 55.00,
            dailyPrice: 320.00,
            dailyRate: 320.00,
            weeklyPrice: 1500.00,
            monthlyPrice: 4800.00,
            currency: 'USD',
            coverImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800',
            imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800',
            galleryImages: [
              'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800',
              'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=800',
              'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&q=80&w=800'
            ],
            amenities: ['WiFi', 'Coffee', 'Projector', 'Whiteboard', 'Reception', 'AC', 'Wheelchair Access'],
            features: ['Panoramic City Views', 'Soundproof Privacy Glass', 'Private Lounge Alcove', 'Dedicated High-Speed Router'],
            availability: 'Available',
            isAvailable: true,
            openingHours: '08:00',
            closingHours: '20:00',
            location: 'Executive Tower, Floor 5',
            mapLocation: 'Suite 501',
            status: 'published',
            featured: true,
            displayOrder: 2,
            rating: 5.0,
            totalReviews: 24,
            availabilityRules: { startHour: 8, endHour: 20, allowedDays: [0, 1, 2, 3, 4, 5, 6] },
            bufferTime: 15,
          },
          {
            tenantId: 'weventurehub',
            title: 'Startup Lounge',
            name: 'Startup Lounge',
            slug: 'startup-lounge',
            shortDescription: 'Vibrant multi-seat coworking area designed for tech teams, product demos, and casual pitch meetings.',
            fullDescription: 'Fuel your startup journey in an energetic environment designed for fast-growing ventures. Offers modular desk layouts, direct access to mentorship rooms, high-capacity power points, and interactive whiteboard walls.',
            category: 'Dedicated Desk',
            workspaceType: 'DEDICATED_DESK',
            type: 'DEDICATED_DESK',
            capacity: 6,
            floor: 'Floor 2',
            size: '600 sq ft',
            hourlyPrice: 25.00,
            hourlyRate: 25.00,
            dailyPrice: 140.00,
            dailyRate: 140.00,
            weeklyPrice: 700.00,
            monthlyPrice: 2200.00,
            currency: 'USD',
            coverImage: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&q=80&w=800',
            imageUrl: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&q=80&w=800',
            galleryImages: [
              'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&q=80&w=800',
              'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800'
            ],
            amenities: ['WiFi', 'Coffee', 'Whiteboard', 'Kitchen', 'AC', 'Locker', 'Printer'],
            features: ['Dedicated Desk Locks', 'Community Pitch Wall', 'Unlimited Coffee & Kombucha', 'Priority Event Registration'],
            availability: 'Available',
            isAvailable: true,
            openingHours: '07:00',
            closingHours: '23:00',
            location: 'Building B, Floor 2',
            mapLocation: 'Innovation Wing B',
            status: 'published',
            featured: true,
            displayOrder: 3,
            rating: 4.8,
            totalReviews: 42,
            availabilityRules: { startHour: 7, endHour: 23, allowedDays: [0, 1, 2, 3, 4, 5, 6] },
            bufferTime: 0,
          },
          {
            tenantId: 'weventurehub',
            title: 'Premium Meeting Room',
            name: 'Premium Meeting Room',
            slug: 'premium-meeting-room',
            shortDescription: 'State-of-the-art boardroom equipped with 4K video conferencing, digital whiteboard, and acoustic panels.',
            fullDescription: 'Conduct flawless hybrid meetings with client boards, remote investors, and international partners. Features 85-inch 4K dual screens, motorized blinds, studio microphones, and acoustic wall paneling for crystal-clear audio.',
            category: 'Meeting Room',
            workspaceType: 'MEETING_ROOM',
            type: 'MEETING_ROOM',
            capacity: 12,
            floor: 'Floor 3',
            size: '500 sq ft',
            hourlyPrice: 45.00,
            hourlyRate: 45.00,
            dailyPrice: 280.00,
            dailyRate: 280.00,
            weeklyPrice: 1200.00,
            monthlyPrice: 3800.00,
            currency: 'USD',
            coverImage: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800',
            imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800',
            galleryImages: [
              'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800',
              'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800'
            ],
            amenities: ['WiFi', 'Projector', 'Whiteboard', 'Coffee', 'AC', 'Wheelchair Access'],
            features: ['Dual 85" 4K Smart Displays', 'Studio Array Microphones', 'Catering & Coffee Service', 'One-Touch Zoom/Teams Join'],
            availability: 'Available',
            isAvailable: true,
            openingHours: '08:00',
            closingHours: '20:00',
            location: 'Main Tower, Floor 3',
            mapLocation: 'Boardroom 302',
            status: 'published',
            featured: true,
            displayOrder: 4,
            rating: 4.9,
            totalReviews: 31,
            availabilityRules: { startHour: 8, endHour: 20, allowedDays: [0, 1, 2, 3, 4, 5, 6] },
            bufferTime: 15,
          },
          {
            tenantId: 'weventurehub',
            title: 'Creative Studio',
            name: 'Creative Studio',
            slug: 'creative-studio',
            shortDescription: 'Soundproof media studio with podcast equipment, studio lighting, green screen, and editing desks.',
            fullDescription: 'Produce professional media content, video courses, podcasts, and digital interviews. Fully acoustically treated with Shure SM7B broadcast microphones, softbox lighting, 4K camera mounts, and a multi-track digital audio console.',
            category: 'Podcast Studio',
            workspaceType: 'PODCAST_STUDIO',
            type: 'PODCAST_STUDIO',
            capacity: 8,
            floor: 'Ground Floor',
            size: '400 sq ft',
            hourlyPrice: 65.00,
            hourlyRate: 65.00,
            dailyPrice: 380.00,
            dailyRate: 380.00,
            weeklyPrice: 1800.00,
            monthlyPrice: 5500.00,
            currency: 'USD',
            coverImage: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800',
            imageUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800',
            galleryImages: [
              'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800',
              'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=800'
            ],
            amenities: ['WiFi', 'AC', 'Coffee', 'Sound Isolation', 'Locker'],
            features: ['Acoustic Treatment Rating STC-55', 'Shure SM7B Broadcast Mics', '4K CamLink Video Capture', 'Green Screen Wall'],
            availability: 'Available',
            isAvailable: true,
            openingHours: '08:00',
            closingHours: '22:00',
            location: 'Media Wing, Ground Floor',
            mapLocation: 'Studio A',
            status: 'published',
            featured: false,
            displayOrder: 5,
            rating: 5.0,
            totalReviews: 19,
            availabilityRules: { startHour: 8, endHour: 22, allowedDays: [0, 1, 2, 3, 4, 5, 6] },
            bufferTime: 15,
          },
          {
            tenantId: 'weventurehub',
            title: 'Event Hall Alpha',
            name: 'Event Hall Alpha',
            slug: 'event-hall-alpha',
            shortDescription: 'Sprawling multi-purpose venue equipped with stage, PA sound system, projector arrays, and 200 seating.',
            fullDescription: 'Host memorable tech keynotes, product launches, pitch competitions, and corporate galas. Equipped with a modular main stage, professional line-array sound, DMX lighting control, and high-speed live stream broadcasting equipment.',
            category: 'Event Hall',
            workspaceType: 'EVENT_VENUE',
            type: 'EVENT_VENUE',
            capacity: 150,
            floor: 'Ground Floor',
            size: '2500 sq ft',
            hourlyPrice: 120.00,
            hourlyRate: 120.00,
            dailyPrice: 800.00,
            dailyRate: 800.00,
            weeklyPrice: 3800.00,
            monthlyPrice: 12000.00,
            currency: 'USD',
            coverImage: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=800',
            imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=800',
            galleryImages: [
              'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=800',
              'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&q=80&w=800'
            ],
            amenities: ['WiFi', 'Projector', 'Parking', 'Wheelchair Access', 'Reception', 'AC', 'Coffee'],
            features: ['Main Stage & Podium', 'Line-Array PA System', '4K Live Stream Setup', 'Catering Preparation Kitchen'],
            availability: 'Available',
            isAvailable: true,
            openingHours: '08:00',
            closingHours: '23:00',
            location: 'Main Atrium, Ground Floor',
            mapLocation: 'Hall Alpha',
            status: 'published',
            featured: false,
            displayOrder: 6,
            rating: 4.9,
            totalReviews: 45,
            availabilityRules: { startHour: 8, endHour: 23, allowedDays: [0, 1, 2, 3, 4, 5, 6] },
            bufferTime: 30,
          },
          {
            tenantId: 'weventurehub',
            title: 'Training Center',
            name: 'Training Center',
            slug: 'training-center',
            shortDescription: 'Fully wired computer lab & classroom layout with interactive podium, dual projectors, and seating for 30.',
            fullDescription: 'Empower your workforce with hands-on coding bootcamps, workshops, and corporate seminars. Equipped with dual ceiling projectors, high-density power strips at every row, instructor console, and ergonomic mesh seating.',
            category: 'Training Room',
            workspaceType: 'TRAINING_ROOM',
            type: 'TRAINING_ROOM',
            capacity: 30,
            floor: 'Floor 2',
            size: '1100 sq ft',
            hourlyPrice: 75.00,
            hourlyRate: 75.00,
            dailyPrice: 450.00,
            dailyRate: 450.00,
            weeklyPrice: 2000.00,
            monthlyPrice: 6500.00,
            currency: 'USD',
            coverImage: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=800',
            imageUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=800',
            galleryImages: [
              'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=800',
              'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800'
            ],
            amenities: ['WiFi', 'Projector', 'Whiteboard', 'Coffee', 'AC', 'Printer'],
            features: ['Classroom Tier Seating', 'Interactive Instructor Podium', 'Dedicated Gigabit Router', 'Whiteboard Perimeter Walls'],
            availability: 'Available',
            isAvailable: true,
            openingHours: '08:00',
            closingHours: '21:00',
            location: 'Education Wing, Floor 2',
            mapLocation: 'Room 208',
            status: 'published',
            featured: false,
            displayOrder: 7,
            rating: 4.8,
            totalReviews: 22,
            availabilityRules: { startHour: 8, endHour: 21, allowedDays: [0, 1, 2, 3, 4, 5, 6] },
            bufferTime: 15,
          },
          {
            tenantId: 'weventurehub',
            title: 'Open Workspace',
            name: 'Open Workspace',
            slug: 'open-workspace',
            shortDescription: 'Spacious open-plan hot desk zone with natural light, power outlets at every desk, and complimentary espresso.',
            fullDescription: 'Drop in anytime for productive individual desk work. Sunlit, high-ceiling atrium setup with quiet zones, ergonomic task lighting, and easy access to community breakrooms.',
            category: 'Hot Desk',
            workspaceType: 'HOT_DESK',
            type: 'HOT_DESK',
            capacity: 1,
            floor: 'Floor 1',
            size: '1800 sq ft',
            hourlyPrice: 5.00,
            hourlyRate: 5.00,
            dailyPrice: 30.00,
            dailyRate: 30.00,
            weeklyPrice: 150.00,
            monthlyPrice: 500.00,
            currency: 'USD',
            coverImage: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=800',
            imageUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=800',
            galleryImages: [
              'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=800',
              'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&q=80&w=800'
            ],
            amenities: ['WiFi', 'Coffee', 'Printer', 'AC', 'Lockers', 'Wheelchair Access'],
            features: ['Abundant Natural Sunlight', 'Quiet Zone Etiquette', 'On-Demand Printing Station', 'Ergonomic Standing Desks'],
            availability: 'Available',
            isAvailable: true,
            openingHours: '00:00',
            closingHours: '24:00',
            location: 'Central Atrium, Floor 1',
            mapLocation: 'Desk Zone A',
            status: 'published',
            featured: false,
            displayOrder: 8,
            rating: 4.7,
            totalReviews: 50,
            availabilityRules: { startHour: 0, endHour: 24, allowedDays: [0, 1, 2, 3, 4, 5, 6] },
            bufferTime: 0,
          },
          {
            tenantId: 'weventurehub',
            title: 'Founder Suite',
            name: 'Founder Suite',
            slug: 'founder-suite',
            shortDescription: 'Exclusive private suite with dedicated high-speed Wi-Fi, private meeting alcove, and 24/7 keycard access.',
            fullDescription: 'A private sanctuary for company founders and co-founding teams requiring confidentiality and uninterrupted focus. Includes private meeting lounge, keycard access, filing cabinets, and priority booking across all conference rooms.',
            category: 'Private Office',
            workspaceType: 'PRIVATE_OFFICE',
            type: 'PRIVATE_OFFICE',
            capacity: 2,
            floor: 'Floor 6',
            size: '300 sq ft',
            hourlyPrice: 50.00,
            hourlyRate: 50.00,
            dailyPrice: 300.00,
            dailyRate: 300.00,
            weeklyPrice: 1400.00,
            monthlyPrice: 4200.00,
            currency: 'USD',
            coverImage: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=800',
            imageUrl: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=800',
            galleryImages: [
              'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=800',
              'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800'
            ],
            amenities: ['WiFi', 'Coffee', 'Whiteboard', 'Reception', 'AC', 'Locker'],
            features: ['Biometric / Keycard Access', 'Dedicated High-Speed Network', 'Lockable Storage Cabinets', 'Private Lounge Seating'],
            availability: 'Available',
            isAvailable: true,
            openingHours: '00:00',
            closingHours: '24:00',
            location: 'Executive Tower, Floor 6',
            mapLocation: 'Suite 604',
            status: 'published',
            featured: false,
            displayOrder: 9,
            rating: 5.0,
            totalReviews: 15,
            availabilityRules: { startHour: 0, endHour: 24, allowedDays: [0, 1, 2, 3, 4, 5, 6] },
            bufferTime: 15,
          },
          {
            tenantId: 'weventurehub',
            title: 'Collaboration Space',
            name: 'Collaboration Space',
            slug: 'collaboration-space',
            shortDescription: 'Flexible breakout space with movable whiteboards, lounge pods, and modular seating for agile sprints.',
            fullDescription: 'Break out of standard conference rooms into an open collaborative layout built for team agile sprints, product roadmapping, and creative whiteboarding. Features rolling whiteboards, comfortable lounge pods, and display monitors.',
            category: 'Conference Room',
            workspaceType: 'CONFERENCE_ROOM',
            type: 'CONFERENCE_ROOM',
            capacity: 16,
            floor: 'Floor 3',
            size: '750 sq ft',
            hourlyPrice: 50.00,
            hourlyRate: 50.00,
            dailyPrice: 320.00,
            dailyRate: 320.00,
            weeklyPrice: 1400.00,
            monthlyPrice: 4500.00,
            currency: 'USD',
            coverImage: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800',
            imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800',
            galleryImages: [
              'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800',
              'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&q=80&w=800'
            ],
            amenities: ['WiFi', 'Projector', 'Whiteboard', 'Coffee', 'Kitchen', 'AC'],
            features: ['4 Mobile Magnetic Whiteboards', 'Modular Soft Seating Pods', 'Multi-Display TV Monitors', 'Espresso & Snack Bar Access'],
            availability: 'Available',
            isAvailable: true,
            openingHours: '08:00',
            closingHours: '22:00',
            location: 'Building B, Floor 3',
            mapLocation: 'Collab Lounge 3',
            status: 'published',
            featured: false,
            displayOrder: 10,
            rating: 4.9,
            totalReviews: 28,
            availabilityRules: { startHour: 8, endHour: 22, allowedDays: [0, 1, 2, 3, 4, 5, 6] },
            bufferTime: 15,
          }
        ]);
        logger.info('🌱 Successfully seeded 10 dynamic enterprise demo workspaces into MongoDB');
      }

      // Ensure all existing workspaces are updated to allow weekend bookings to prevent validation failures during checks
      await Workspace.updateMany(
        {},
        { $set: { 'availabilityRules.allowedDays': [0, 1, 2, 3, 4, 5, 6] } }
      );
      logger.info('🔧 Ensured all workspaces are active and reservable 7 days a week');

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

      // 3. Seed Sponsors (Exclusive Sponsor: ArifPay)
      await Sponsor.deleteMany({ name: { $ne: 'ArifPay' } });
      const sponsorCount = await Sponsor.countDocuments();
      if (sponsorCount === 0) {
        await Sponsor.create([
          {
            tenantId: 'weventurehub',
            name: 'ArifPay',
            logoUrl: 'https://arifpay.net/wp-content/uploads/2021/08/arifpay-logo.png',
            websiteUrl: 'https://arifpay.net',
            tier: 'Platinum',
            isPublished: true
          }
        ]);
        logger.info('🌱 Seeded Exclusive Sponsor: ArifPay');
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
