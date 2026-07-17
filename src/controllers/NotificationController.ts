import { Request, Response, NextFunction } from 'express';
import { notificationService, AnnouncementTarget } from '../services/NotificationService';
import { ApiResponse } from '../utils/response';
import { IUserIdentity, UserRole } from '../types';
import { ForbiddenError, ValidationError } from '../errors/AppError';

export class NotificationController {
  /**
   * Fetch user notifications
   */
  public async getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const user = req.user as IUserIdentity;
      const limit = parseInt(req.query.limit as string) || 50;

      const notifications = await notificationService.getUserNotifications(user.id, tenantId, limit);
      ApiResponse.success(res, notifications, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark a notification as read
   */
  public async markRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user as IUserIdentity;
      const { id } = req.params;

      if (!id) {
        throw new ValidationError('Notification ID is required');
      }

      const updated = await notificationService.markAsRead(id, user.id);
      ApiResponse.success(res, updated, 200, {
        message: 'Notification marked as read successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark all notifications of a user as read
   */
  public async markAllRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const user = req.user as IUserIdentity;

      const count = await notificationService.markAllAsRead(user.id, tenantId);
      ApiResponse.success(res, { count }, 200, {
        message: `${count} notifications marked as read`,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Fetch tenant timeline activities
   */
  public async getActivities(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const limit = parseInt(req.query.limit as string) || 50;

      const activities = await notificationService.getActivities(tenantId, limit);
      ApiResponse.success(res, activities, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Fetch tenant announcements
   */
  public async getAnnouncements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const user = req.user as IUserIdentity;
      const limit = parseInt(req.query.limit as string) || 20;

      // Filter audience based on active user role
      let audience = AnnouncementTarget.ALL;
      if (user) {
        if ([UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.STAFF].includes(user.role)) {
          audience = AnnouncementTarget.STAFF;
        } else if (user.role === UserRole.HUB_MEMBER) {
          audience = AnnouncementTarget.HUB_MEMBER;
        } else {
          audience = AnnouncementTarget.EXTERNAL_USER;
        }
      }

      const announcements = await notificationService.getAnnouncements(tenantId, audience, limit);
      ApiResponse.success(res, announcements, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create an Announcement (Admin/Staff only)
   */
  public async createAnnouncement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const user = req.user as IUserIdentity;

      const isAdminOrStaff = [UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.STAFF].includes(user.role);
      if (!isAdminOrStaff) {
        throw new ForbiddenError('Only administration can issue global or localized announcements');
      }

      const { title, content, targetAudience, scheduledFor, sendEmail, memberEmails } = req.body;

      if (!title || !content) {
        throw new ValidationError('Announcement title and content are required fields');
      }

      const announcement = await notificationService.createAnnouncement({
        tenantId,
        title,
        content,
        targetAudience: targetAudience || AnnouncementTarget.ALL,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
        createdBy: `${user.firstName} ${user.lastName}`,
        sendEmail: !!sendEmail,
        memberEmails: memberEmails || [],
      });

      ApiResponse.success(res, announcement, 201, {
        message: 'Announcement successfully created',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();
