import { Router } from 'express';
import { cmsController } from '../controllers/CmsController';
import { authGuard } from '../middleware/authGuard';
import { hasRoles } from '../middleware/roleGuard';
import { UserRole } from '../types';

const cmsRouter = Router();
const ADMIN_ROLES = [UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.STAFF];

// Company Info
cmsRouter.get('/company-info', (req, res, next) => cmsController.getCompanyInfo(req, res, next));
cmsRouter.put('/company-info', authGuard, hasRoles(ADMIN_ROLES), (req, res, next) => cmsController.updateCompanyInfo(req, res, next));

// Homepage CMS
cmsRouter.get('/homepage', (req, res, next) => cmsController.getHomepage(req, res, next));
cmsRouter.put('/homepage', authGuard, hasRoles(ADMIN_ROLES), (req, res, next) => cmsController.updateHomepage(req, res, next));

// About Page CMS
cmsRouter.get('/about', (req, res, next) => cmsController.getAboutPage(req, res, next));
cmsRouter.put('/about', authGuard, hasRoles(ADMIN_ROLES), (req, res, next) => cmsController.updateAboutPage(req, res, next));

// FAQs CMS
cmsRouter.get('/faqs', (req, res, next) => cmsController.getFaqs(req, res, next));
cmsRouter.post('/faqs', authGuard, hasRoles(ADMIN_ROLES), (req, res, next) => cmsController.createFaq(req, res, next));
cmsRouter.put('/faqs/:id', authGuard, hasRoles(ADMIN_ROLES), (req, res, next) => cmsController.updateFaq(req, res, next));
cmsRouter.delete('/faqs/:id', authGuard, hasRoles(ADMIN_ROLES), (req, res, next) => cmsController.deleteFaq(req, res, next));

// Navigation Menu CMS
cmsRouter.get('/navigation', (req, res, next) => cmsController.getNavigationMenus(req, res, next));
cmsRouter.put('/navigation', authGuard, hasRoles(ADMIN_ROLES), (req, res, next) => cmsController.updateNavigationMenu(req, res, next));

export { cmsRouter };
