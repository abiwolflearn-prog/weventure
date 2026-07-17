import { Router } from 'express';
import { publicApiController } from '../controllers/PublicApiController';

const router = Router();

// Events
router.get('/events', (req, res, next) => publicApiController.getEvents(req, res, next));
router.get('/events/upcoming', (req, res, next) => publicApiController.getUpcomingEvents(req, res, next));
router.get('/events/ongoing', (req, res, next) => publicApiController.getOngoingEvents(req, res, next));
router.get('/events/completed', (req, res, next) => publicApiController.getCompletedEvents(req, res, next));
router.get('/events/featured', (req, res, next) => publicApiController.getFeaturedEvents(req, res, next));

// Workspaces
router.get('/workspaces/availability', (req, res, next) => publicApiController.getWorkspaceAvailability(req, res, next));
router.get('/workspaces', (req, res, next) => publicApiController.getWorkspaces(req, res, next));
router.get('/workspaces/:id', (req, res, next) => publicApiController.getWorkspaceById(req, res, next));

// Bookings
router.post('/bookings', (req, res, next) => publicApiController.createBooking(req, res, next));

// News
router.get('/news', (req, res, next) => publicApiController.getNews(req, res, next));

// Other assets
router.get('/homepage', (req, res, next) => publicApiController.getHomepage(req, res, next));
router.get('/sponsors', (req, res, next) => publicApiController.getSponsors(req, res, next));
router.get('/partners', (req, res, next) => publicApiController.getPartners(req, res, next));
router.get('/testimonials', (req, res, next) => publicApiController.getTestimonials(req, res, next));

export default router;
