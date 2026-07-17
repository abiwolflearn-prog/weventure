import { Router } from 'express';
import { analyticsController } from '../controllers/AnalyticsController';
import { authGuard } from '../middleware/authGuard';
import { hasPermission } from '../middleware/roleGuard';
import { Permission } from '../types';

const analyticsRouter = Router();

// Secure all analytics endpoints under the ANALYTICS_READ permission context
analyticsRouter.use(authGuard);
analyticsRouter.use(hasPermission(Permission.ANALYTICS_READ));

/**
 * @route   GET /api/v1/analytics/summary
 * @desc    Fetch high-level KPI cards with growth trends
 * @access  Private (Admins / Staff with analytics:read)
 */
analyticsRouter.get('/summary', analyticsController.getSummary);

/**
 * @route   GET /api/v1/analytics/events
 * @desc    Fetch detailed event metrics
 * @access  Private (Admins / Staff with analytics:read)
 */
analyticsRouter.get('/events', analyticsController.getEvents);

/**
 * @route   GET /api/v1/analytics/bookings
 * @desc    Fetch workspace booking metrics
 * @access  Private (Admins / Staff with analytics:read)
 */
analyticsRouter.get('/bookings', analyticsController.getBookings);

/**
 * @route   GET /api/v1/analytics/revenue
 * @desc    Fetch detailed revenue metrics and daily timeline
 * @access  Private (Admins / Staff with analytics:read)
 */
analyticsRouter.get('/revenue', analyticsController.getRevenue);

/**
 * @route   GET /api/v1/analytics/users
 * @desc    Fetch user growth and registration trend
 * @access  Private (Admins / Staff with analytics:read)
 */
analyticsRouter.get('/users', analyticsController.getUsers);

/**
 * @route   GET /api/v1/analytics/workspaces
 * @desc    Fetch workspace rankings and metrics by space type
 * @access  Private (Admins / Staff with analytics:read)
 */
analyticsRouter.get('/workspaces', analyticsController.getWorkspaces);

export default analyticsRouter;
