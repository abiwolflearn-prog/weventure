import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/response';
import { StartupProgram } from '../models/StartupProgram';
import { StartupApplication } from '../models/StartupApplication';
import { Faq } from '../models/Faq';
import { Testimonial } from '../models/Testimonial';

// Initial Seed Programs to ensure rich content out of the box
const DEFAULT_PROGRAMS = [
  {
    title: 'Idea Validation Sprint',
    slug: 'idea-validation',
    category: 'Validation',
    shortDescription: 'Transform raw concepts into validated market solutions with structured customer discovery, prototype testing, and business model canvas reviews.',
    fullDescription: 'An intensive 4-week validation framework designed for early founders. Receive hands-on guidance on value proposition design, customer interviews, and initial landing page conversion tests.',
    duration: '4 Weeks',
    cohortSize: 20,
    icon: 'Lightbulb',
    benefits: ['Customer Discovery Workshops', '1-on-1 Mentor Office Hours', 'Prototype Feedback Sessions', 'Pre-seed Canvas Review'],
    eligibility: 'Early-stage ideation founders & university innovators',
    status: 'active',
    ctaText: 'Apply Validation',
    sortOrder: 1,
  },
  {
    title: 'Incubation Cohort',
    slug: 'incubation-program',
    category: 'Incubation',
    shortDescription: 'A 12-week comprehensive program providing dedicated workspace, expert mentorship, technical architecture guidance, and business registration support.',
    fullDescription: 'Our flagship incubation pathway gives startups the physical, technical, and strategic foundation required to build robust products and establish operational momentum.',
    duration: '12 Weeks',
    cohortSize: 15,
    icon: 'Rocket',
    benefits: ['24/7 Hot Desk & Meeting Room Credits', 'Dedicated Technical Advisor', 'Legal & Tax Structure Support', 'Demo Day Pitch Seat'],
    eligibility: 'Founders with a working MVP or prototype',
    status: 'active',
    ctaText: 'Apply Incubation',
    sortOrder: 2,
  },
  {
    title: 'Growth Acceleration',
    slug: 'acceleration-program',
    category: 'Acceleration',
    shortDescription: 'For scaling startups with early revenue seeking growth marketing, pipeline expansion, investor readiness, and venture capital connections.',
    fullDescription: 'Accelerate your customer acquisition and revenue velocity. Work directly with growth executives, institutional investors, and strategic corporate partners.',
    duration: '6 Months',
    cohortSize: 10,
    icon: 'TrendingUp',
    benefits: ['Growth Hacking Masterclasses', 'Warm Investor Introductions', 'Up to $50k Cloud & SaaS Perks', 'Corporate Partner Pilots'],
    eligibility: 'Post-MVP startups with proven initial traction',
    status: 'active',
    ctaText: 'Apply Acceleration',
    sortOrder: 3,
  },
  {
    title: 'Startup Mentorship Network',
    slug: 'startup-mentorship',
    category: 'Mentorship',
    shortDescription: 'Direct access to senior tech leaders, serial entrepreneurs, legal experts, and seasoned executives for tailored strategic guidance.',
    fullDescription: 'Continuous 1-on-1 advisory pairing matching your startup with industry leaders specializing in product architecture, go-to-market strategies, and fundraising.',
    duration: 'Ongoing',
    cohortSize: 30,
    icon: 'Users',
    benefits: ['Bi-weekly 1-on-1 Mentorship', 'Advisory Board Matching', 'Executive Pitch Coaching', 'Peer Founder Circles'],
    eligibility: 'Accepted incubation & acceleration founders',
    status: 'active',
    ctaText: 'Join Mentorship',
    sortOrder: 4,
  },
  {
    title: 'Investor Readiness Program',
    slug: 'investor-readiness',
    category: 'Investor Readiness',
    shortDescription: 'Master your financial modeling, term sheet negotiation, cap table structure, and pitch deck storytelling to secure funding.',
    fullDescription: 'Prepare your venture for rigorous angel and venture capital due diligence. Includes mock pitch panels with real venture capitalists.',
    duration: '6 Weeks',
    cohortSize: 12,
    icon: 'DollarSign',
    benefits: ['Cap Table & Financial Modeling', 'Term Sheet Workshops', 'Mock VC Pitch Panels', 'Due Diligence Vault Setup'],
    eligibility: 'Startups preparing for Pre-Seed or Seed fundraising',
    status: 'active',
    ctaText: 'Get Investor Ready',
    sortOrder: 5,
  },
  {
    title: 'Product Development Support',
    slug: 'product-development',
    category: 'Tech Support',
    shortDescription: 'Technical architecture reviews, UI/UX audits, cloud infrastructure design, and AI model integration support from senior engineering leads.',
    fullDescription: 'Build scalable enterprise software. Our resident CTOs and software architects review codebases, database designs, and DevOps pipelines.',
    duration: '8 Weeks',
    cohortSize: 15,
    icon: 'Code',
    benefits: ['Code & Architecture Audit', 'UI/UX Design Review', 'DevOps & Security Assessment', 'AI & API Integration Assistance'],
    eligibility: 'Tech founders building web, mobile, or AI products',
    status: 'active',
    ctaText: 'Get Tech Support',
    sortOrder: 6,
  },
  {
    title: 'Business Registration & Legal',
    slug: 'business-registration',
    category: 'Legal',
    shortDescription: 'Navigate company formation, IP protection, trademark filing, employment contracts, and regulatory compliance effortlessly.',
    fullDescription: 'Complete legal setup tailored for startups. Avoid common equity mistakes, secure intellectual property, and draft robust founder agreements.',
    duration: 'Flexible',
    cohortSize: 25,
    icon: 'Shield',
    benefits: ['Entity Registration Assistance', 'IP & Patent Strategy', 'Founder Equity Agreements', 'Compliance Audits'],
    eligibility: 'All registered and unregistered startup founders',
    status: 'active',
    ctaText: 'Get Legal Guidance',
    sortOrder: 7,
  },
  {
    title: 'Pitch Training & Storytelling',
    slug: 'pitch-training',
    category: 'Training',
    shortDescription: 'Refine your pitch deck narrative, slide design, public speaking, and Q&A defense to captivate judges, investors, and clients.',
    fullDescription: 'High-impact communication coaching. Practice live pitch drills, record presentations, and receive actionable feedback on body language and deck design.',
    duration: '3 Weeks',
    cohortSize: 20,
    icon: 'Mic',
    benefits: ['Pitch Deck Redesign Review', 'Public Speaking Drills', 'Investor Q&A Rehearsals', 'Video Pitch Recording'],
    eligibility: 'Founders preparing for Demo Days and competitions',
    status: 'active',
    ctaText: 'Enroll Pitch Class',
    sortOrder: 8,
  },
  {
    title: 'Market Access & Corporate Pilots',
    slug: 'market-access',
    category: 'Market Access',
    shortDescription: 'Connect with enterprise buyers, industry partners, and regional distributors to launch commercial proof-of-concept pilots.',
    fullDescription: 'Bridge the gap between startups and corporate enterprises. Pitch solutions directly to innovation managers at leading financial institutions and tech firms.',
    duration: 'Quarterly',
    cohortSize: 10,
    icon: 'Globe',
    benefits: ['Enterprise B2B Introductions', 'Commercial Pilot Matching', 'PR & Media Distribution', 'Regional Trade Delegations'],
    eligibility: 'B2B and SaaS startups with market-tested products',
    status: 'active',
    ctaText: 'Access Market',
    sortOrder: 9,
  },
  {
    title: 'Networking & Founder Mixer Events',
    slug: 'networking-events',
    category: 'Networking',
    shortDescription: 'Regular fireside chats, pitch nights, investor mixers, and ecosystem networking gatherings held at WeVentureHub.',
    fullDescription: 'Build enduring relationships in Ethiopia and East Africa’s tech ecosystem. Meet co-founders, hire top talent, and discover strategic synergies.',
    duration: 'Monthly',
    cohortSize: 50,
    icon: 'Calendar',
    benefits: ['VIP Ecosystem Passes', 'Exclusive Founder Dinners', 'Talent Matching Booths', 'Angel Investor Meetups'],
    eligibility: 'Open community access for all ecosystem builders',
    status: 'active',
    ctaText: 'Join Next Event',
    sortOrder: 10,
  }
];

export class StartupController {
  // Public: Get all active startup programs (seeds if empty)
  public async getPrograms(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      let programs = await (StartupProgram as any).find({ tenantId, status: 'active' }).sort({ sortOrder: 1 }).exec();

      if (!programs || programs.length === 0) {
        // Seed default programs
        const docs = DEFAULT_PROGRAMS.map((p) => ({ ...p, tenantId }));
        programs = await (StartupProgram as any).insertMany(docs);
      }

      ApiResponse.success(res, { programs }, 200);
    } catch (error) {
      next(error);
    }
  }

  // Public: Submit a startup application
  public async submitApplication(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      const {
        programId,
        programTitle,
        startupName,
        founderName,
        email,
        phone,
        industry,
        startupStage,
        teamSize,
        website,
        linkedIn,
        briefDescription,
        currentChallenges,
        fundingStatus,
      } = req.body;

      if (!startupName || !founderName || !email || !phone || !briefDescription) {
        res.status(400).json({ success: false, message: 'Please complete all required fields.' });
        return;
      }

      const application = await (StartupApplication as any).create({
        tenantId,
        programId: programId || '',
        programTitle: programTitle || 'General Incubator Application',
        startupName,
        founderName,
        email,
        phone,
        industry: industry || 'Fintech',
        startupStage: startupStage || 'MVP Built',
        teamSize: teamSize || '1-3 members',
        website: website || '',
        linkedIn: linkedIn || '',
        briefDescription,
        currentChallenges: currentChallenges || '',
        fundingStatus: fundingStatus || 'Bootstrapped',
        status: 'pending',
      });

      ApiResponse.success(res, { application }, 201, {
        message: 'Your startup application has been submitted successfully! Our team will contact you within 48 hours.',
      });
    } catch (error) {
      next(error);
    }
  }

  // Admin: Get all applications
  public async getAllApplications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      const { status, industry, search } = req.query;

      const filter: any = { tenantId };
      if (status && status !== 'all') {
        filter.status = status;
      }
      if (industry && industry !== 'all') {
        filter.industry = industry;
      }
      if (search) {
        filter.$or = [
          { startupName: { $regex: search, $options: 'i' } },
          { founderName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ];
      }

      const applications = await (StartupApplication as any).find(filter).sort({ createdAt: -1 }).exec();
      ApiResponse.success(res, { applications, count: applications.length }, 200);
    } catch (error) {
      next(error);
    }
  }

  // Admin: Update application status or review notes
  public async updateApplicationStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status, reviewNotes } = req.body;

      const application = await (StartupApplication as any).findByIdAndUpdate(
        id,
        { $set: { ...(status && { status }), ...(reviewNotes !== undefined && { reviewNotes }) } },
        { new: true }
      ).exec();

      if (!application) {
        res.status(404).json({ success: false, message: 'Application not found' });
        return;
      }

      ApiResponse.success(res, { application }, 200, { message: 'Application status updated.' });
    } catch (error) {
      next(error);
    }
  }

  // Admin: Delete application
  public async deleteApplication(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await (StartupApplication as any).findByIdAndDelete(id).exec();
      ApiResponse.success(res, null, 200, { message: 'Application removed successfully.' });
    } catch (error) {
      next(error);
    }
  }

  // Admin: Create program
  public async createProgram(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      const body = req.body;

      const slug = body.title ? body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : `program-${Date.now()}`;
      const program = await (StartupProgram as any).create({
        ...body,
        tenantId,
        slug,
      });

      ApiResponse.success(res, { program }, 201, { message: 'Startup program created.' });
    } catch (error) {
      next(error);
    }
  }

  // Admin: Update program
  public async updateProgram(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const body = req.body;

      const program = await (StartupProgram as any).findByIdAndUpdate(id, { $set: body }, { new: true }).exec();
      if (!program) {
        res.status(404).json({ success: false, message: 'Program not found' });
        return;
      }

      ApiResponse.success(res, { program }, 200, { message: 'Startup program updated.' });
    } catch (error) {
      next(error);
    }
  }

  // Admin: Delete program
  public async deleteProgram(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await (StartupProgram as any).findByIdAndDelete(id).exec();
      ApiResponse.success(res, null, 200, { message: 'Program deleted successfully.' });
    } catch (error) {
      next(error);
    }
  }
}

export const startupController = new StartupController();
