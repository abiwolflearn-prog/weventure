import { Server as SocketIOServer } from 'socket.io';
import { Notification, NotificationCategory, INotificationDocument } from '../models/Notification';
import { Activity, IActivityDocument } from '../models/Activity';
import { Announcement, AnnouncementTarget, IAnnouncementDocument } from '../models/Announcement';
import { emailService } from './EmailService';
import { logger } from '../utils/logger';

class NotificationService {
  private io: SocketIOServer | null = null;

  /**
   * Bind Socket.IO server on startup
   */
  public init(io: SocketIOServer) {
    this.io = io;
    logger.info('🔌 Socket.IO bound securely inside NotificationService');
  }

  /**
   * Send real-time event to a room if socket is initialized
   */
  private emitEvent(room: string, eventName: string, payload: any) {
    if (this.io) {
      this.io.to(room).emit(eventName, payload);
      logger.info(`🔌 [SOCKET EMIT] Room: "${room}" | Event: "${eventName}"`);
    } else {
      logger.warn(`⚠️ [SOCKET DELAYED] Socket Server not initialized yet. Room: "${room}" | Event: "${eventName}"`);
    }
  }

  /**
   * Create and deliver notification to database and Socket.IO
   */
  public async createNotification(params: {
    tenantId: string;
    userId: string;
    title: string;
    message: string;
    category: NotificationCategory;
    link?: string;
    sendEmail?: boolean;
    userEmail?: string;
  }): Promise<INotificationDocument> {
    // 1. Persist in Database
    const notification = await Notification.create({
      tenantId: params.tenantId.toLowerCase(),
      userId: params.userId.toLowerCase(),
      title: params.title,
      message: params.message,
      category: params.category,
      link: params.link,
      isRead: false,
    });

    // 2. Deliver via Socket.IO directly to the user's secure room
    const userRoom = `user:${params.userId.toLowerCase()}`;
    const payload = notification.toJSON();
    this.emitEvent(userRoom, 'notification:received', payload);

    // Also notify tenant broad dashboard of any system activities if necessary
    const tenantRoom = `tenant:${params.tenantId.toLowerCase()}`;
    this.emitEvent(tenantRoom, 'dashboard:update', {
      type: 'NOTIFICATION_TRIGGERED',
      category: params.category,
      message: params.message,
    });

    // 3. Optional Email delivery
    if (params.sendEmail && params.userEmail) {
      const emailHtml = emailService.getAnnouncementTemplate({
        title: params.title,
        content: params.message,
      });
      // Fire-and-forget email dispatch
      emailService.sendEmail({
        to: params.userEmail,
        subject: `[WeVentureHub] ${params.title}`,
        html: emailHtml,
      }).catch((err) => {
        logger.error(`❌ Email dispatch failed for user ${params.userEmail}`, err);
      });
    }

    return notification;
  }

  /**
   * Create Timeline Activity entry
   */
  public async trackActivity(params: {
    tenantId: string;
    userId: string;
    userEmail: string;
    userName: string;
    action: string;
    resourceType: string;
    resourceId: string;
    details?: Record<string, any>;
  }): Promise<IActivityDocument> {
    const activity = await Activity.create({
      tenantId: params.tenantId.toLowerCase(),
      userId: params.userId.toLowerCase(),
      userEmail: params.userEmail,
      userName: params.userName,
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      details: params.details,
    });

    // Broadcast activity stream to tenant wide room for live feeds
    const tenantRoom = `tenant:${params.tenantId.toLowerCase()}`;
    this.emitEvent(tenantRoom, 'activity:new', activity.toJSON());

    return activity;
  }

  /**
   * Create a global or targeted tenant-wide Announcement
   */
  public async createAnnouncement(params: {
    tenantId: string;
    title: string;
    content: string;
    targetAudience: AnnouncementTarget;
    scheduledFor?: Date;
    createdBy: string;
    sendEmail?: boolean;
    memberEmails?: string[]; // Optional: Dispatch to targeted list
  }): Promise<IAnnouncementDocument> {
    const isScheduled = params.scheduledFor && new Date(params.scheduledFor) > new Date();

    const announcement = await Announcement.create({
      tenantId: params.tenantId.toLowerCase(),
      title: params.title,
      content: params.content,
      targetAudience: params.targetAudience,
      scheduledFor: params.scheduledFor,
      isPublished: !isScheduled, // Unpublished if scheduled for future
      createdBy: params.createdBy,
    });

    if (!isScheduled) {
      // Broadcast live to tenant room immediately
      const tenantRoom = `tenant:${params.tenantId.toLowerCase()}`;
      this.emitEvent(tenantRoom, 'announcement:received', announcement.toJSON());

      // If requested, send to emails
      if (params.sendEmail && params.memberEmails && params.memberEmails.length > 0) {
        const emailHtml = emailService.getAnnouncementTemplate({
          title: params.title,
          content: params.content,
        });

        // Send emails concurrently
        Promise.all(
          params.memberEmails.map((email) =>
            emailService.sendEmail({
              to: email,
              subject: `[Announcement] ${params.title}`,
              html: emailHtml,
            })
          )
        ).catch((err) => {
          logger.error('❌ Failed to complete all announcement emails', err);
        });
      }
    }

    return announcement;
  }

  /**
   * Mark a notification as read
   */
  public async markAsRead(notificationId: string, userId: string): Promise<INotificationDocument | null> {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId: userId.toLowerCase() },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (notification) {
      const userRoom = `user:${userId.toLowerCase()}`;
      this.emitEvent(userRoom, 'notification:updated', notification.toJSON());
    }

    return notification;
  }

  /**
   * Mark all notifications of a user as read
   */
  public async markAllAsRead(userId: string, tenantId: string): Promise<number> {
    const result = await Notification.updateMany(
      { userId: userId.toLowerCase(), tenantId: tenantId.toLowerCase(), isRead: false },
      { isRead: true, readAt: new Date() }
    );

    const userRoom = `user:${userId.toLowerCase()}`;
    this.emitEvent(userRoom, 'notification:all_read', { userId, tenantId });

    return result.modifiedCount;
  }

  /**
   * Fetch active user notifications
   */
  public async getUserNotifications(userId: string, tenantId: string, limit = 50): Promise<INotificationDocument[]> {
    return await Notification.find({
      userId: userId.toLowerCase(),
      tenantId: tenantId.toLowerCase(),
    })
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  /**
   * Fetch tenant announcements
   */
  public async getAnnouncements(
    tenantId: string,
    audience?: AnnouncementTarget,
    limit = 20
  ): Promise<IAnnouncementDocument[]> {
    const query: any = {
      tenantId: tenantId.toLowerCase(),
      isPublished: true,
      $or: [
        { scheduledFor: { $exists: false } },
        { scheduledFor: { $lte: new Date() } },
      ],
    };

    if (audience && audience !== AnnouncementTarget.ALL) {
      query.targetAudience = { $in: [AnnouncementTarget.ALL, audience] };
    }

    return await Announcement.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  /**
   * Fetch timeline activities
   */
  public async getActivities(tenantId: string, limit = 50): Promise<IActivityDocument[]> {
    return await Activity.find({ tenantId: tenantId.toLowerCase() })
      .sort({ createdAt: -1 })
      .limit(limit);
  }
}

export const notificationService = new NotificationService();
export { NotificationCategory, AnnouncementTarget };
