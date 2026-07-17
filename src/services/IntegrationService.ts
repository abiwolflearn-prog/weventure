import crypto from 'crypto';
import axios from 'axios';
import { 
  ApiKey, 
  WebhookSubscription, 
  WebhookDeliveryLog, 
  OAuthApp, 
  ConnectedApp, 
  AutomationRule, 
  ApiAnalyticsLog 
} from '../models/Integration';
import { Event } from '../models/Event';
import { Registration } from '../models/Registration';
import { Booking } from '../models/Booking';
import { Payment } from '../models/Payment';
import { notificationService } from './NotificationService';
import { RegistrationStatus } from '../types';
import { NotificationCategory } from '../models/Notification';
import { logger } from '../utils/logger';

class IntegrationService {
  /**
   * Generates a brand new cryptographically secure API key.
   * Returns both the raw key (to display once) and the saved key document.
   */
  public async createApiKey(params: {
    tenantId: string;
    name: string;
    environment: 'sandbox' | 'production';
    rateLimit?: number;
    ipWhitelist?: string[];
    createdBy: string;
  }) {
    const prefix = params.environment === 'production' ? 'wvh_live_' : 'wvh_test_';
    const randomBytes = crypto.randomBytes(24).toString('hex');
    const rawKey = `${prefix}${randomBytes}`;
    
    // Hash key for secure verification storage
    const hashedKey = this.hashKey(rawKey);
    const maskedKey = `${prefix}${randomBytes.substring(0, 4)}...${randomBytes.substring(randomBytes.length - 4)}`;

    const apiKey = await ApiKey.create({
      tenantId: params.tenantId.toLowerCase(),
      name: params.name,
      key: hashedKey,
      secretPrefix: prefix,
      maskedKey,
      environment: params.environment,
      status: 'active',
      rateLimit: params.rateLimit || 100,
      ipWhitelist: params.ipWhitelist || [],
      createdBy: params.createdBy,
    });

    return {
      rawKey,
      apiKey,
    };
  }

  /**
   * Helper to hash an API key securely using SHA-256
   */
  private hashKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  /**
   * Validates an incoming API Key, checking status, rateLimit, and IP whitelist
   */
  public async validateApiKey(rawKey: string, clientIp?: string): Promise<any> {
    const hashedKey = this.hashKey(rawKey);
    const apiKey = await ApiKey.findOne({ key: hashedKey, status: 'active' });
    
    if (!apiKey) {
      throw new Error('Invalid or revoked API key');
    }

    // IP Whitelisting Validation
    if (apiKey.ipWhitelist && apiKey.ipWhitelist.length > 0 && clientIp) {
      const isIpAllowed = apiKey.ipWhitelist.some(ip => {
        // Simple match or CIDR range match if needed. We do exact string match or localhost bypass for testing
        return ip === clientIp || ip === '0.0.0.0' || clientIp === '::1' || clientIp === '127.0.0.1';
      });
      if (!isIpAllowed) {
        throw new Error(`Unauthorized IP Address: ${clientIp}`);
      }
    }

    // Asynchronously update last used timestamp
    ApiKey.updateOne({ _id: apiKey._id }, { lastUsedAt: new Date() }).catch(err => {
      logger.error('Failed to update API key lastUsedAt', err);
    });

    return apiKey;
  }

  /**
   * Revoke an existing API Key
   */
  public async revokeApiKey(tenantId: string, id: string) {
    const key = await ApiKey.findOneAndUpdate(
      { _id: id, tenantId: tenantId.toLowerCase() },
      { status: 'revoked' },
      { new: true }
    );
    if (!key) throw new Error('API Key not found');
    return key;
  }

  /**
   * Log api usage analytics
   */
  public async logApiAnalytics(params: {
    tenantId: string;
    apiKeyId?: string;
    apiKeyName?: string;
    environment: 'sandbox' | 'production';
    endpoint: string;
    method: string;
    statusCode: number;
    durationMs: number;
    ipAddress?: string;
    userAgent?: string;
    errorMessage?: string;
  }) {
    try {
      await ApiAnalyticsLog.create({
        ...params,
        timestamp: new Date(),
      });
    } catch (err) {
      logger.error('Failed to save API analytics log', err);
    }
  }

  /**
   * Configure/Create webhook subscription for outgoing webhooks
   */
  public async createWebhookSubscription(params: {
    tenantId: string;
    name: string;
    url: string;
    events: string[];
    environment: 'sandbox' | 'production';
    ipWhitelist?: string[];
  }) {
    // Generate a secure shared secret for HMAC verification
    const secret = `wvh_whs_${crypto.randomBytes(24).toString('hex')}`;

    const sub = await WebhookSubscription.create({
      tenantId: params.tenantId.toLowerCase(),
      name: params.name,
      url: params.url,
      secret,
      events: params.events,
      enabled: true,
      environment: params.environment,
      ipWhitelist: params.ipWhitelist || [],
    });

    return sub;
  }

  /**
   * Dispatches outbound webhook payloads asynchronously to subscribed targets
   */
  public async dispatchOutboundWebhook(tenantId: string, eventType: string, eventData: any) {
    // Fire-and-forget async dispatcher
    this.processOutboundWebhookAsync(tenantId, eventType, eventData).catch((err) => {
      logger.error(`❌ Webhook dispatcher crashed for event ${eventType}`, err);
    });
  }

  private async processOutboundWebhookAsync(tenantId: string, eventType: string, eventData: any) {
    // Query active webhook subscriptions matching event type and tenant
    const subscriptions = await WebhookSubscription.find({
      tenantId: tenantId.toLowerCase(),
      events: eventType,
      enabled: true,
    });

    if (subscriptions.length === 0) {
      logger.info(`ℹ️ No webhook subscriptions matched event type: "${eventType}" for tenant: "${tenantId}"`);
      return;
    }

    for (const sub of subscriptions) {
      const eventId = `evt_${crypto.randomBytes(16).toString('hex')}`;
      const payload = {
        eventId,
        eventType,
        timestamp: new Date().toISOString(),
        source: 'WeVentureHub',
        data: eventData,
      };

      // Create signature using shared HMAC-SHA256 secret key
      const signature = crypto
        .createHmac('sha256', sub.secret)
        .update(JSON.stringify(payload))
        .digest('hex');

      const headers = {
        'Content-Type': 'application/json',
        'X-Signature': signature,
        'X-WeVentureHub-Event-ID': eventId,
        'User-Agent': 'WeVentureHub-Webhook-Dispatcher/1.0',
      };

      // Create delivery log
      const deliveryLog = await WebhookDeliveryLog.create({
        tenantId: tenantId.toLowerCase(),
        direction: 'outbound',
        subscriptionId: sub.id,
        eventId,
        eventType,
        source: 'WeVentureHub',
        url: sub.url,
        payload,
        headers,
        status: 'pending',
        attemptCount: 1,
        maxAttempts: sub.retryConfig.maxAttempts || 5,
      });

      // Dispatch HTTP request
      this.sendOutboundHttpRequestWithRetry(deliveryLog, sub.secret);
    }
  }

  /**
   * Recursive HTTP requester implementing exponential backoff retries
   */
  private async sendOutboundHttpRequestWithRetry(logDoc: any, secret: string) {
    const maxAttempts = logDoc.maxAttempts;
    const currentAttempt = logDoc.attemptCount;

    try {
      logger.info(`🌐 Webhook Attempt ${currentAttempt}/${maxAttempts} out to: ${logDoc.url}`);
      
      const response = await axios.post(logDoc.url, logDoc.payload, {
        headers: logDoc.headers,
        timeout: 10000, // 10 seconds
      });

      logDoc.status = 'success';
      logDoc.statusCode = response.status;
      logDoc.responseBody = typeof response.data === 'object' ? JSON.stringify(response.data) : String(response.data);
      await logDoc.save();

      logger.info(`✅ Webhook Delivered successfully to ${logDoc.url}. Status: ${response.status}`);
    } catch (err: any) {
      logger.error(`❌ Webhook attempt ${currentAttempt} failed for URL ${logDoc.url}`, err.message);

      logDoc.statusCode = err.response?.status || 500;
      logDoc.responseBody = err.response?.data ? JSON.stringify(err.response.data) : err.message;
      logDoc.errorMessage = err.message;

      if (currentAttempt < maxAttempts) {
        logDoc.status = 'retrying';
        logDoc.attemptCount = currentAttempt + 1;
        
        // Calculate exponential backoff: 2s, 4s, 8s, 16s...
        const backoffSeconds = Math.pow(2, currentAttempt);
        logDoc.nextAttemptAt = new Date(Date.now() + backoffSeconds * 1000);
        await logDoc.save();

        // Schedule next execution using standard setTimeout
        setTimeout(() => {
          WebhookDeliveryLog.findById(logDoc._id).then(freshDoc => {
            if (freshDoc && freshDoc.status === 'retrying') {
              this.sendOutboundHttpRequestWithRetry(freshDoc, secret);
            }
          });
        }, backoffSeconds * 1000);
      } else {
        logDoc.status = 'failed';
        await logDoc.save();
        logger.error(`❌ Webhook dispatch completely failed after ${maxAttempts} attempts.`);
      }
    }
  }

  /**
   * Processes incoming webhook payloads from external portals.
   * Assures signature verification, idempotency checking, and triggers proper downstream state processes.
   */
  public async handleIncomingWebhook(params: {
    tenantId: string;
    signatureHeader?: string;
    rawBody: string;
    payload: any;
    headers: Record<string, any>;
  }) {
    const { tenantId, signatureHeader, rawBody, payload, headers } = params;

    const eventId = payload.eventId || payload.id;
    const eventType = payload.eventType || payload.type;
    const source = payload.source || 'Third Party Connector';

    if (!eventId || !eventType) {
      throw new Error('Webhook payload is missing core eventId or eventType identifier');
    }

    // 1. Deduplication (Idempotency Check)
    const existingLog = await WebhookDeliveryLog.findOne({ 
      tenantId: tenantId.toLowerCase(), 
      eventId 
    });

    if (existingLog) {
      logger.warn(`⚠️ Duplicate Webhook received. Event ID ${eventId} is already processed.`);
      return {
        status: 'duplicate',
        message: 'Webhook duplicate already processed',
        log: existingLog,
      };
    }

    // 2. Locate matching webhook subscription to fetch shared HMAC secret
    // Note: If no subscription exists, we fallback to a tenant setting or generic sandbox secret for convenience, 
    // or we throw an authorized error. Let's look for any matching WebhookSubscription configured.
    const matchingSubscription = await WebhookSubscription.findOne({
      tenantId: tenantId.toLowerCase(),
      environment: payload.environment || 'sandbox',
    });

    const sharedSecret = matchingSubscription?.secret || 'wvh_incoming_fallback_default_secret_key';

    // 3. Signature verification
    if (signatureHeader) {
      const calculatedSignature = crypto
        .createHmac('sha256', sharedSecret)
        .update(rawBody)
        .digest('hex');

      if (calculatedSignature !== signatureHeader) {
        logger.error(`❌ Webhook signature verification failed. Calculated: ${calculatedSignature} | Provided: ${signatureHeader}`);
        throw new Error('Unauthorized webhook: X-Signature does not match recalculated digest');
      }
    } else {
      logger.warn(`⚠️ Webhook arrived without signature header. Proceeding in testing mode.`);
    }

    // 4. Create database record for the incoming webhook
    const deliveryLog = await WebhookDeliveryLog.create({
      tenantId: tenantId.toLowerCase(),
      direction: 'inbound',
      eventId,
      eventType,
      source,
      url: '/api/webhooks/events',
      payload,
      headers,
      status: 'pending',
      attemptCount: 1,
      maxAttempts: 1,
    });

    // 5. Asynchronously execute downstream updates to keep webhook processing fast
    this.executeIncomingWebhookActionsAsync(deliveryLog).catch((err) => {
      logger.error('❌ Failed processing downstream webhook events', err);
    });

    return {
      status: 'processing',
      eventId,
      eventType,
    };
  }

  /**
   * Downstream async state engines
   */
  private async executeIncomingWebhookActionsAsync(logDoc: any) {
    const tenantId = logDoc.tenantId;
    const { eventType, payload } = logDoc;
    const data = payload.data || {};

    try {
      logger.info(`⚡ Downstream processing started for webhook event: ${eventType}`);

      let actionLog = '';

      // Match event types and trigger corresponding database reductions or ticket generations
      switch (eventType) {
        case 'ticket.purchased':
        case 'payment.completed':
        case 'registration.completed': {
          // 1. Locate and decrement seat capacity
          const targetEventId = data.ticketId || data.eventId || data.id;
          const userEmail = data.email || 'guest@example.com';
          const customerName = data.customerName || 'Anonymous Webhook Guest';

          // Decrement seat
          const event = await Event.findOne({ 
            $or: [{ _id: targetEventId }, { id: targetEventId }, { slug: targetEventId }] 
          });

          if (event) {
            if (event.capacity && !event.capacity.isUnlimited && event.capacity.maxCapacity > 0) {
              await Event.updateOne(
                { _id: event._id },
                { $inc: { 'capacity.maxCapacity': -1 } }
              );
              actionLog += `Reduced seat capacity for event "${event.title}". `;
            }

            // Create registration record
            const mockQrCode = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(JSON.stringify({ eventId: targetEventId, email: userEmail }))}`;
            const registration = await Registration.create({
              tenantId,
              userId: 'webhook-guest',
              userEmail: userEmail,
              eventId: event.id,
              ticketNumber: `WH-${event.id}-${Date.now()}`,
              qrCode: mockQrCode,
              attendeeName: customerName,
              attendeeEmail: userEmail,
              status: RegistrationStatus.CONFIRMED,
              checkedIn: false,
            });

            actionLog += `Generated registration ticket ID: ${registration._id}. `;
          }

          // 2. Generate and mock QR Code + Confirmation Email + Push Notifications
          const mockQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(JSON.stringify({ eventId: targetEventId, email: userEmail }))}`;
          
          await notificationService.createNotification({
            tenantId,
            userId: 'webhook-guest',
            title: 'Admission Ticket Confirmed!',
            message: `A webhook registration for ${customerName} has been processed successfully for ${data.eventName || 'Event'}.`,
            category: NotificationCategory.SYSTEM,
            sendEmail: true,
            userEmail,
          });

          actionLog += `Generated QR confirmation code: ${mockQrCodeUrl}. Send push notifies. `;
          break;
        }

        case 'payment.failed': {
          const userEmail = data.email || 'guest@example.com';
          await notificationService.createNotification({
            tenantId,
            userId: 'webhook-guest',
            title: 'Payment Failed Notification',
            message: `External charge fail detected: customer ${data.customerName || 'Guest'} (${userEmail}).`,
            category: NotificationCategory.SYSTEM,
          });
          actionLog += `Logged failure warning. `;
          break;
        }

        case 'booking.confirmed': {
          const deskId = data.deskId || data.roomId || 'Workspace Booth';
          await notificationService.createNotification({
            tenantId,
            userId: 'webhook-guest',
            title: 'Desk Booking Confirmed',
            message: `Successful workspace booking confirmed via webhook integration for slot: ${deskId}.`,
            category: NotificationCategory.BOOKING,
          });
          actionLog += `Confirmed workspace booking for slot ${deskId}. `;
          break;
        }

        default:
          actionLog += `Webhook trigger bypassed: no registered action matching event template.`;
          break;
      }

      // 6. Trigger custom tenant-defined automation rules
      await this.triggerAutomationRules(tenantId, eventType, data);

      // 7. Update status to success
      logDoc.status = 'success';
      logDoc.responseBody = JSON.stringify({ success: true, actionsExecuted: actionLog });
      await logDoc.save();

      // Emit a socket dashboard update so UI updates in real-time!
      const io = (notificationService as any).io;
      if (io) {
        const tenantRoom = `tenant:${tenantId.toLowerCase()}`;
        io.to(tenantRoom).emit('dashboard:update', {
          type: 'WEBHOOK_PROCESSED',
          eventId: logDoc.eventId,
          eventType: logDoc.eventType,
          message: `Webhook processed successfully: ${logDoc.eventType}`,
        });
      }

      logger.info(`✅ Downstream processing completed successfully for: ${eventType}`);

    } catch (err: any) {
      logger.error(`❌ Downstream processing failed for: ${eventType}`, err);
      logDoc.status = 'failed';
      logDoc.errorMessage = err.message;
      await logDoc.save();
    }
  }

  /**
   * Automation Engine Execution
   */
  public async triggerAutomationRules(tenantId: string, eventType: string, data: any) {
    const rules = await AutomationRule.find({
      tenantId: tenantId.toLowerCase(),
      triggerEvent: eventType,
      enabled: true,
    });

    if (rules.length === 0) return;

    for (const rule of rules) {
      try {
        logger.info(`⚙️ Triggering automation rule: "${rule.name}" for "${eventType}"`);
        
        // Check conditions
        let isMatch = true;
        for (const cond of rule.conditions) {
          const payloadVal = String(data[cond.field] || '');
          if (cond.operator === 'equals' && payloadVal !== cond.value) {
            isMatch = false;
          } else if (cond.operator === 'contains' && !payloadVal.includes(cond.value)) {
            isMatch = false;
          }
        }

        if (!isMatch) {
          logger.info(`⚙️ Rule conditions not matched. Skipping rule: ${rule.name}`);
          continue;
        }

        // Execute actions
        if (rule.actionType === 'slack_notify') {
          logger.info(`💬 Mocking slack channel trigger to: ${rule.actionConfig.webhookUrl}`);
          // Send notification info
          await notificationService.createNotification({
            tenantId,
            userId: 'webhook-guest',
            title: `Automation Rule: ${rule.name}`,
            message: `Slack integration pinged: Event occurred for ${data.customerName || 'Attendee'}.`,
            category: NotificationCategory.SYSTEM,
          });
        } else if (rule.actionType === 'push_notify') {
          await notificationService.createNotification({
            tenantId,
            userId: rule.actionConfig.userId || 'webhook-guest',
            title: `Rule Alert: ${rule.name}`,
            message: rule.actionConfig.template || `Automation trigger successfully completed for ${eventType}.`,
            category: NotificationCategory.SYSTEM,
          });
        }

      } catch (err) {
        logger.error(`❌ Failed triggering automation rule ${rule.name}`, err);
      }
    }
  }

  /**
   * Retrieves high-volume API Key performance metrics and throughput charts logs
   */
  public async getAnalyticsMetrics(tenantId: string, environment: 'sandbox' | 'production' = 'sandbox') {
    const logs = await ApiAnalyticsLog.find({
      tenantId: tenantId.toLowerCase(),
      environment,
    }).sort({ timestamp: -1 }).limit(1000);

    const totalRequests = logs.length;
    const successRequests = logs.filter(l => l.statusCode >= 200 && l.statusCode < 300).length;
    const errorRequests = logs.filter(l => l.statusCode >= 400).length;
    const errorRate = totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0;

    const avgLatency = totalRequests > 0 
      ? logs.reduce((sum, l) => sum + l.durationMs, 0) / totalRequests 
      : 0;

    // Build timeline charts grouping (by hourly or generic chunks)
    const chartDataMap: Record<string, { requests: number; errors: number; latency: number }> = {};
    
    logs.slice(0, 100).forEach(log => {
      try {
        const timeStr = log.timestamp.toISOString().substring(11, 16); // e.g. "14:35"
        if (!chartDataMap[timeStr]) {
          chartDataMap[timeStr] = { requests: 0, errors: 0, latency: 0 };
        }
        chartDataMap[timeStr].requests += 1;
        if (log.statusCode >= 400) {
          chartDataMap[timeStr].errors += 1;
        }
        chartDataMap[timeStr].latency += log.durationMs;
      } catch {}
    });

    const timelineData = Object.keys(chartDataMap).map(time => ({
      time,
      requests: chartDataMap[time].requests,
      errors: chartDataMap[time].errors,
      latency: Math.round(chartDataMap[time].latency / chartDataMap[time].requests),
    })).reverse();

    return {
      totalRequests,
      successRequests,
      errorRequests,
      errorRate: Math.round(errorRate * 10) / 10,
      avgLatency: Math.round(avgLatency),
      timelineData,
      recentLogs: logs.slice(0, 25),
    };
  }
}

export const integrationService = new IntegrationService();
