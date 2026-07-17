import { Router } from 'express';
import { notificationController } from '../controllers/NotificationController';
import { authGuard } from '../middleware/authGuard';
import { hasRoles } from '../middleware/roleGuard';
import { UserRole } from '../types';

const notificationRouter = Router();

// Retrieve user notifications
notificationRouter.get('/notifications', authGuard, notificationController.getNotifications);

// Mark single notification as read
notificationRouter.patch('/notifications/:id/read', authGuard, notificationController.markRead);

// Mark all notifications as read
notificationRouter.post('/notifications/read-all', authGuard, notificationController.markAllRead);

// Retrieve timeline activities (accessible to all authenticated users of the tenant)
notificationRouter.get('/activities', authGuard, notificationController.getActivities);

// Retrieve active published announcements
notificationRouter.get('/announcements', authGuard, notificationController.getAnnouncements);

// Create a targeted or global Announcement (Admin/Staff only)
notificationRouter.post(
  '/announcements',
  authGuard,
  hasRoles([UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.STAFF]),
  notificationController.createAnnouncement
);

export default notificationRouter;
