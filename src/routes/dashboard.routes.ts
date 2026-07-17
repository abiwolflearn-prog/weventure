import { Router } from 'express';
import { dashboardController } from '../controllers/DashboardController';
import { authGuard } from '../middleware/authGuard';

const dashboardRouter = Router();

// Secure all dashboard endpoints under user authentication
dashboardRouter.use(authGuard);

dashboardRouter.get('/overview', dashboardController.getOverview);
dashboardRouter.get('/revenue', dashboardController.getRevenue);
dashboardRouter.get('/events', dashboardController.getEvents);
dashboardRouter.get('/bookings', dashboardController.getBookings);
dashboardRouter.get('/payments', dashboardController.getPayments);
dashboardRouter.get('/workspaces', dashboardController.getWorkspaces);
dashboardRouter.get('/registrations', dashboardController.getRegistrations);
dashboardRouter.get('/charts', dashboardController.getCharts);

export default dashboardRouter;
