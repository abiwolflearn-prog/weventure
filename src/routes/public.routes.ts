import { Router } from 'express';
import { publicMarketplaceController } from '../controllers/PublicMarketplaceController';

const publicRouter = Router();

/**
 * @route   GET /api/v1/public/events
 * @desc    Fetch lists of active, published public event listings with advanced filter & sorting
 * @access  Public
 */
publicRouter.get('/events', publicMarketplaceController.getEvents);

/**
 * @route   POST /api/v1/public/contact
 * @desc    Submit public contact form inquiry
 * @access  Public
 */
publicRouter.post('/contact', (req, res, next) => {
  publicMarketplaceController.submitContact(req, res, next);
});

/**
 * @route   GET /api/v1/public/events/categories
 * @desc    Fetch unique categories across published events
 * @access  Public
 */
publicRouter.get('/events/categories', publicMarketplaceController.getCategories);

/**
 * @route   GET /api/v1/public/events/tags
 * @desc    Fetch unique tags across published events
 * @access  Public
 */
publicRouter.get('/events/tags', publicMarketplaceController.getTags);

/**
 * @route   GET /api/v1/public/events/slug/:slug
 * @desc    Retrieve detailed event metadata by SEO slug
 * @access  Public
 */
publicRouter.get('/events/slug/:slug', publicMarketplaceController.getEventBySlug);

/**
 * @route   GET /api/v1/public/events/recommendations
 * @desc    Get recommended events related to category/tags
 * @access  Public
 */
publicRouter.get('/events/recommendations', publicMarketplaceController.getRecommendations);

/**
 * @route   GET /api/v1/public/organizers
 * @desc    Fetch listed active organizer profiles (tenants)
 * @access  Public
 */
publicRouter.get('/organizers', publicMarketplaceController.getOrganizers);

/**
 * @route   GET /api/v1/public/organizers/:id
 * @desc    Retrieve dynamic organizer profile by ID
 * @access  Public
 */
publicRouter.get('/organizers/:id', publicMarketplaceController.getOrganizerProfile);

/**
 * @route   GET /api/v1/public/events/:eventId/reviews
 * @desc    Retrieve all reviews for an event
 * @access  Public
 */
publicRouter.get('/events/:eventId/reviews', publicMarketplaceController.getReviews);

/**
 * @route   POST /api/v1/public/events/:eventId/reviews
 * @desc    Add a review for an event
 * @access  Public
 */
publicRouter.post('/events/:eventId/reviews', publicMarketplaceController.addReview);

/**
 * @route   GET /api/v1/public/workspaces
 * @desc    Fetch lists of active, public workspaces
 * @access  Public
 */
publicRouter.get('/workspaces', publicMarketplaceController.getWorkspaces);

/**
 * @route   GET /api/v1/public/workspaces/:id
 * @desc    Get detailed workspace info by ID
 * @access  Public
 */
publicRouter.get('/workspaces/:id', publicMarketplaceController.getWorkspaceById);

/**
 * @route   GET /api/v1/public/organizers/:id/website
 * @desc    Get dynamic white-labeled public website settings for organizer
 * @access  Public
 */
publicRouter.get('/organizers/:id/website', publicMarketplaceController.getOrganizerWebsite);

/**
 * @route   GET /api/v1/public/sitemap
 * @desc    Serve dynamic XML sitemap
 * @access  Public
 */
publicRouter.get('/sitemap', publicMarketplaceController.getSitemap);

/**
 * @route   GET /api/v1/public/seo/:tenantId/structured-data
 * @desc    Serve JSON-LD Structured Data
 * @access  Public
 */
publicRouter.get('/seo/:tenantId/structured-data', publicMarketplaceController.getStructuredData);

export default publicRouter;
