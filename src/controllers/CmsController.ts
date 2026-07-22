import { Request, Response, NextFunction } from 'express';
import { CompanyInfo } from '../models/CompanyInfo';
import { Homepage } from '../models/Homepage';
import { AboutPage } from '../models/AboutPage';
import { Faq } from '../models/Faq';
import { NavigationMenu } from '../models/NavigationMenu';
import { Gallery } from '../models/Gallery';
import { Testimonial } from '../models/Testimonial';
import { Partner } from '../models/Partner';
import { Sponsor } from '../models/Sponsor';
import { News } from '../models/News';
import { Plan } from '../models/Plan';
import { ApiResponse } from '../utils/response';
import { NotFoundError, ValidationError } from '../errors/AppError';

export class CmsController {
  // --- COMPANY INFO ---
  public async getCompanyInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      let info = await (CompanyInfo as any).findOne({ tenantId }).lean();
      if (!info) {
        info = await (CompanyInfo as any).create({ tenantId });
      }
      ApiResponse.success(res, { info }, 200);
    } catch (error) {
      next(error);
    }
  }

  public async updateCompanyInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      const updated = await (CompanyInfo as any).findOneAndUpdate(
        { tenantId },
        { $set: { tenantId, ...req.body } },
        { upsert: true, new: true }
      );
      ApiResponse.success(res, { info: updated }, 200, { message: 'Company information updated successfully.' });
    } catch (error) {
      next(error);
    }
  }

  // --- HOMEPAGE CMS ---
  public async getHomepage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      let homepage = await (Homepage as any).findOne({ tenantId }).lean();
      if (!homepage) {
        homepage = await (Homepage as any).create({
          tenantId,
          heroTitle: 'Where Modern Ethiopian Startups Scale and Innovate',
          heroSubtitle: 'Instant booking for premium meeting rooms, dedicated workspaces, and world-class accelerator programs.',
          heroCtaText: 'Explore Available Spaces',
          heroCtaLink: '/workspaces',
          heroImageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200',
          promotionTitle: 'Hot Desk Summer Promo',
          promotionSubtitle: 'Access Silicon Core Hub 24/7 with premium coffee, high-speed fiber internet, and free meeting hours.',
          promotionImageUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=600',
          promotionPrice: '$110/mo',
          communityHighlights: [
            { title: 'Tech Accelerator Cohort', description: 'Over 24 companies incubated annually.', imageUrl: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&q=80&w=300' },
            { title: 'B2B Technical Mixers', description: 'Monthly networking events with founders and investors.', imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=300' }
          ],
          startupPrograms: [
            { title: 'Silicon Addis Incubation', description: 'An intensive 12-week program for pre-product startup teams in Addis Ababa.', duration: '12 Weeks', cohortSize: 8, ctaText: 'Apply Cohort' },
            { title: 'AI Engineering Mastery', description: 'Advanced training on deep learning, prompt engineering, and LLM orchestration.', duration: '6 Weeks', cohortSize: 20, ctaText: 'Join Mastery Program' }
          ]
        });
      }
      ApiResponse.success(res, { homepage }, 200);
    } catch (error) {
      next(error);
    }
  }

  public async updateHomepage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      const updated = await (Homepage as any).findOneAndUpdate(
        { tenantId },
        { $set: { tenantId, ...req.body } },
        { upsert: true, new: true }
      );
      ApiResponse.success(res, { homepage: updated }, 200, { message: 'Homepage CMS content updated successfully.' });
    } catch (error) {
      next(error);
    }
  }

  // --- ABOUT PAGE CMS ---
  public async getAboutPage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      let about = await (AboutPage as any).findOne({ tenantId }).lean();
      if (!about) {
        about = await (AboutPage as any).create({
          tenantId,
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
        });
      }
      ApiResponse.success(res, { about }, 200);
    } catch (error) {
      next(error);
    }
  }

  public async updateAboutPage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      const updated = await (AboutPage as any).findOneAndUpdate(
        { tenantId },
        { $set: { tenantId, ...req.body } },
        { upsert: true, new: true }
      );
      ApiResponse.success(res, { about: updated }, 200, { message: 'About page CMS updated successfully.' });
    } catch (error) {
      next(error);
    }
  }

  // --- FAQ CMS ---
  public async getFaqs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      const { category, search, includeUnpublished } = req.query;
      const query: any = { tenantId, isDeleted: { $ne: true } };

      if (!includeUnpublished) {
        query.isPublished = true;
      }
      if (category) {
        query.category = String(category);
      }
      if (search) {
        const regex = new RegExp(String(search), 'i');
        query.$or = [{ question: regex }, { answer: regex }, { category: regex }];
      }

      const faqs = await (Faq as any).find(query).sort({ sortOrder: 1, createdAt: -1 }).exec();
      ApiResponse.success(res, { faqs }, 200);
    } catch (error) {
      next(error);
    }
  }

  public async createFaq(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      const faq = await (Faq as any).create({ tenantId, ...req.body });
      ApiResponse.success(res, { faq }, 201, { message: 'FAQ created successfully.' });
    } catch (error) {
      next(error);
    }
  }

  public async updateFaq(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const faq = await (Faq as any).findByIdAndUpdate(id, { $set: req.body }, { new: true });
      if (!faq) throw new NotFoundError('FAQ entry not found');
      ApiResponse.success(res, { faq }, 200, { message: 'FAQ updated successfully.' });
    } catch (error) {
      next(error);
    }
  }

  public async deleteFaq(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await (Faq as any).findByIdAndUpdate(id, { $set: { isDeleted: true } });
      ApiResponse.success(res, null, 200, { message: 'FAQ soft deleted successfully.' });
    } catch (error) {
      next(error);
    }
  }

  // --- NAVIGATION MENU CMS ---
  public async getNavigationMenus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      let menus = await (NavigationMenu as any).find({ tenantId }).exec();
      if (!menus || menus.length === 0) {
        // Seed default header and footer menus
        const header = await (NavigationMenu as any).create({
          tenantId,
          menuLocation: 'header',
          items: [
            { label: 'Workspaces', path: '/workspaces', sortOrder: 1, isVisible: true },
            { label: 'Events', path: '/events', sortOrder: 2, isVisible: true },
            { label: 'Membership Plans', path: '/pricing', sortOrder: 3, isVisible: true },
            { label: 'News & Blog', path: '/news', sortOrder: 4, isVisible: true },
            { label: 'About Us', path: '/about', sortOrder: 5, isVisible: true },
            { label: 'Contact', path: '/contact', sortOrder: 6, isVisible: true },
          ],
        });
        const footer = await (NavigationMenu as any).create({
          tenantId,
          menuLocation: 'footer',
          items: [
            { label: 'Privacy Policy', path: '/privacy', sortOrder: 1, isVisible: true },
            { label: 'Terms of Service', path: '/terms', sortOrder: 2, isVisible: true },
            { label: 'FAQ', path: '/faq', sortOrder: 3, isVisible: true },
            { label: 'Gallery', path: '/gallery', sortOrder: 4, isVisible: true },
          ],
        });
        menus = [header, footer];
      }
      ApiResponse.success(res, { menus }, 200);
    } catch (error) {
      next(error);
    }
  }

  public async updateNavigationMenu(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      const { menuLocation, items } = req.body;
      if (!menuLocation || !Array.isArray(items)) {
        throw new ValidationError('menuLocation and items array are required');
      }

      const updated = await (NavigationMenu as any).findOneAndUpdate(
        { tenantId, menuLocation },
        { $set: { tenantId, menuLocation, items } },
        { upsert: true, new: true }
      );
      ApiResponse.success(res, { menu: updated }, 200, { message: 'Navigation menu updated successfully.' });
    } catch (error) {
      next(error);
    }
  }
}

export const cmsController = new CmsController();
