import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { ApiResponse } from '../utils/response';
import { integrationService } from '../services/IntegrationService';
import { 
  ApiKey, 
  WebhookSubscription, 
  WebhookDeliveryLog, 
  OAuthApp, 
  ConnectedApp, 
  AutomationRule 
} from '../models/Integration';
import { Event } from '../models/Event';
import { Booking } from '../models/Booking';
import { EventStatus, EventVisibility } from '../types';
import { logger } from '../utils/logger';

export class IntegrationController {
  // =========================================================================
  // 1. API Keys
  // =========================================================================
  public async getApiKeys(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      const keys = await ApiKey.find({ tenantId: tenantId.toLowerCase() }).sort({ createdAt: -1 });
      ApiResponse.success(res, keys);
    } catch (err) {
      next(err);
    }
  }

  public async createApiKey(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      const { name, environment, rateLimit, ipWhitelist } = req.body;
      const createdBy = req.user?.email || 'admin@weventurehub.com';

      const result = await integrationService.createApiKey({
        tenantId,
        name,
        environment: environment || 'sandbox',
        rateLimit: Number(rateLimit) || 100,
        ipWhitelist: ipWhitelist || [],
        createdBy,
      });

      ApiResponse.success(res, {
        message: 'API Key generated successfully. Please copy it now, as it will not be displayed again.',
        rawKey: result.rawKey,
        apiKey: result.apiKey,
      }, 201);
    } catch (err) {
      next(err);
    }
  }

  public async revokeApiKey(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      const { id } = req.params;
      const updatedKey = await integrationService.revokeApiKey(tenantId, id);
      ApiResponse.success(res, updatedKey);
    } catch (err) {
      next(err);
    }
  }

  // =========================================================================
  // 2. Webhooks (Outbound Subscriptions)
  // =========================================================================
  public async getWebhookSubscriptions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      const subs = await WebhookSubscription.find({ tenantId: tenantId.toLowerCase() }).sort({ createdAt: -1 });
      ApiResponse.success(res, subs);
    } catch (err) {
      next(err);
    }
  }

  public async createWebhookSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      const { name, url, events, environment, ipWhitelist } = req.body;

      const sub = await integrationService.createWebhookSubscription({
        tenantId,
        name,
        url,
        events: events || [],
        environment: environment || 'sandbox',
        ipWhitelist: ipWhitelist || [],
      });

      ApiResponse.success(res, sub, 201);
    } catch (err) {
      next(err);
    }
  }

  public async updateWebhookSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      const { id } = req.params;
      const { name, url, events, enabled, ipWhitelist } = req.body;

      const sub = await WebhookSubscription.findOneAndUpdate(
        { _id: id, tenantId: tenantId.toLowerCase() },
        { name, url, events, enabled, ipWhitelist },
        { new: true }
      );

      if (!sub) {
        res.status(404).json({ success: false, message: 'Subscription not found' });
        return;
      }

      ApiResponse.success(res, sub);
    } catch (err) {
      next(err);
    }
  }

  public async deleteWebhookSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      const { id } = req.params;

      const sub = await WebhookSubscription.findOneAndDelete({ _id: id, tenantId: tenantId.toLowerCase() });
      if (!sub) {
        res.status(404).json({ success: false, message: 'Subscription not found' });
        return;
      }

      ApiResponse.success(res, { message: 'Webhook subscription deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  public async testWebhookSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      const { id } = req.params;

      const sub = await WebhookSubscription.findOne({ _id: id, tenantId: tenantId.toLowerCase() });
      if (!sub) {
        res.status(404).json({ success: false, message: 'Subscription not found' });
        return;
      }

      // Generate a mock dispatch payload
      const mockPayload = {
        testId: `tst_${Math.random().toString(36).substring(7)}`,
        status: 'ok',
        message: 'This is a test notification generated from WeVentureHub Developer Portal.',
      };

      await integrationService.dispatchOutboundWebhook(tenantId, sub.events[0] || 'test.ping', mockPayload);

      ApiResponse.success(res, { message: 'Test webhook queued successfully.' });
    } catch (err) {
      next(err);
    }
  }

  // =========================================================================
  // 3. Webhook Delivery Logs
  // =========================================================================
  public async getDeliveryLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      const logs = await WebhookDeliveryLog.find({ tenantId: tenantId.toLowerCase() })
        .sort({ createdAt: -1 })
        .limit(100);

      ApiResponse.success(res, logs);
    } catch (err) {
      next(err);
    }
  }

  public async retryDeliveryLog(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      const { id } = req.params;

      const log = await WebhookDeliveryLog.findOne({ _id: id, tenantId: tenantId.toLowerCase() });
      if (!log) {
        res.status(404).json({ success: false, message: 'Delivery log not found' });
        return;
      }

      // Reset to pending and queue retry
      log.status = 'pending';
      log.attemptCount += 1;
      await log.save();

      // Fire outbound retry call asynchronously
      const sub = await WebhookSubscription.findById(log.subscriptionId);
      const secret = sub?.secret || 'wvh_incoming_fallback_default_secret_key';

      // Access private method helper or re-run dispatcher logic
      // Note: we can cast to any or run it inside a promise
      (integrationService as any).sendOutboundHttpRequestWithRetry(log, secret);

      ApiResponse.success(res, { message: 'Manual delivery retry initiated successfully.' });
    } catch (err) {
      next(err);
    }
  }

  // =========================================================================
  // 4. Secure Incoming Webhook Listener
  // =========================================================================
  public async handleIncomingWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    const startTime = Date.now();
    const tenantId = req.tenantId || 'weventurehub';
    const signature = req.headers['x-signature'] as string;
    const rawBody = JSON.stringify(req.body);

    try {
      const result = await integrationService.handleIncomingWebhook({
        tenantId,
        signatureHeader: signature,
        rawBody,
        payload: req.body,
        headers: req.headers,
      });

      // Log success analytic
      await integrationService.logApiAnalytics({
        tenantId,
        environment: req.body.environment || 'sandbox',
        endpoint: '/api/webhooks/events',
        method: 'POST',
        statusCode: 200,
        durationMs: Date.now() - startTime,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.status(200).json({
        success: true,
        message: 'Webhook processed successfully',
        data: result,
      });
    } catch (err: any) {
      logger.error('Incoming Webhook Error:', err);

      // Log error analytic
      await integrationService.logApiAnalytics({
        tenantId,
        environment: req.body.environment || 'sandbox',
        endpoint: '/api/webhooks/events',
        method: 'POST',
        statusCode: 400,
        durationMs: Date.now() - startTime,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        errorMessage: err.message,
      });

      res.status(400).json({
        success: false,
        message: 'Webhook processing failed',
        error: err.message,
      });
    }
  }

  // =========================================================================
  // 5. Automation Rules
  // =========================================================================
  public async getAutomationRules(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      const rules = await AutomationRule.find({ tenantId: tenantId.toLowerCase() }).sort({ createdAt: -1 });
      ApiResponse.success(res, rules);
    } catch (err) {
      next(err);
    }
  }

  public async createAutomationRule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      const { name, triggerEvent, conditions, actionType, actionConfig, enabled } = req.body;

      const rule = await AutomationRule.create({
        tenantId: tenantId.toLowerCase(),
        name,
        triggerEvent,
        conditions: conditions || [],
        actionType,
        actionConfig: actionConfig || {},
        enabled: enabled !== false,
      });

      ApiResponse.success(res, rule, 201);
    } catch (err) {
      next(err);
    }
  }

  public async deleteAutomationRule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      const { id } = req.params;

      const rule = await AutomationRule.findOneAndDelete({ _id: id, tenantId: tenantId.toLowerCase() });
      if (!rule) {
        res.status(404).json({ success: false, message: 'Rule not found' });
        return;
      }

      ApiResponse.success(res, { message: 'Rule deleted' });
    } catch (err) {
      next(err);
    }
  }

  // =========================================================================
  // 6. Connected Apps (Marketplace Integrations)
  // =========================================================================
  public async getConnectedApps(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      
      // Default core suite of connected apps
      const coreApps = [
        { appId: 'slack', name: 'Slack', description: 'Post alerts and channels updates whenever events fire.', logo: '💬' },
        { appId: 'hubspot', name: 'HubSpot CRM', description: 'Synchronize ticket purchasers and booking leads to Hubspot Contacts list.', logo: '🧡' },
        { appId: 'stripe', name: 'Stripe API', description: 'Accept global credit card payments securely with real-time webhooks.', logo: '💳' },
        { appId: 'salesforce', name: 'Salesforce', description: 'Streamline enterprise sales funnels and contacts mapping.', logo: '☁️' },
        { appId: 'mailchimp', name: 'Mailchimp', description: 'Add booking registrations straight to marketing lists.', logo: '🐵' },
      ];

      const activeConns = await ConnectedApp.find({ tenantId: tenantId.toLowerCase() });

      const apps = coreApps.map(app => {
        const found = activeConns.find(c => c.appId === app.appId);
        return {
          id: app.appId,
          name: app.name,
          description: app.description,
          logo: app.logo,
          enabled: found ? found.enabled : false,
          settings: found ? found.settings : {},
        };
      });

      ApiResponse.success(res, apps);
    } catch (err) {
      next(err);
    }
  }

  public async toggleConnectedApp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      const { appId } = req.params;
      const { enabled, settings } = req.body;

      let conn = await ConnectedApp.findOne({ tenantId: tenantId.toLowerCase(), appId });
      if (conn) {
        conn.enabled = enabled;
        if (settings) conn.settings = settings;
        await conn.save();
      } else {
        conn = await ConnectedApp.create({
          tenantId: tenantId.toLowerCase(),
          appId,
          appName: appId.charAt(0).toUpperCase() + appId.slice(1),
          enabled,
          settings: settings || {},
        });
      }

      ApiResponse.success(res, conn);
    } catch (err) {
      next(err);
    }
  }

  // =========================================================================
  // 7. OAuth Apps
  // =========================================================================
  public async getOAuthApps(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      const apps = await OAuthApp.find({ tenantId: tenantId.toLowerCase() }).sort({ createdAt: -1 });
      ApiResponse.success(res, apps);
    } catch (err) {
      next(err);
    }
  }

  public async createOAuthApp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      const { name, description, redirectUris, homepageUrl, scopes } = req.body;
      const createdBy = req.user?.email || 'admin@weventurehub.com';

      const clientId = `cli_${crypto.randomUUID().replace(/-/g, '')}`;
      const clientSecret = `sec_${crypto.randomBytes(32).toString('hex')}`;

      const app = await OAuthApp.create({
        tenantId: tenantId.toLowerCase(),
        name,
        description,
        clientId,
        clientSecret,
        redirectUris: redirectUris || [],
        homepageUrl,
        scopes: scopes || ['read'],
        status: 'active',
        createdBy,
      });

      ApiResponse.success(res, app, 201);
    } catch (err) {
      next(err);
    }
  }

  public async deleteOAuthApp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      const { id } = req.params;

      const app = await OAuthApp.findOneAndDelete({ _id: id, tenantId: tenantId.toLowerCase() });
      if (!app) {
        res.status(404).json({ success: false, message: 'OAuth App not found' });
        return;
      }

      ApiResponse.success(res, { message: 'OAuth Application deleted successfully.' });
    } catch (err) {
      next(err);
    }
  }

  // =========================================================================
  // 8. Analytics
  // =========================================================================
  public async getAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      const environment = (req.query.environment as any) || 'sandbox';

      const metrics = await integrationService.getAnalyticsMetrics(tenantId, environment);
      ApiResponse.success(res, metrics);
    } catch (err) {
      next(err);
    }
  }

  // =========================================================================
  // 9. Developer Live Mock API Gateway
  // =========================================================================
  public async getMockEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    const startTime = Date.now();
    const tenantId = req.tenantId || 'weventurehub';
    const context = (req as any).apiKeyContext || {};

    try {
      const events = await Event.find({ tenantId: tenantId.toLowerCase() }).limit(20);
      
      await integrationService.logApiAnalytics({
        tenantId,
        apiKeyId: context.id,
        apiKeyName: context.name,
        environment: context.environment || 'sandbox',
        endpoint: '/api/v1/integrations/api/events',
        method: 'GET',
        statusCode: 200,
        durationMs: Date.now() - startTime,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      ApiResponse.success(res, events);
    } catch (err: any) {
      await integrationService.logApiAnalytics({
        tenantId,
        apiKeyId: context.id,
        apiKeyName: context.name,
        environment: context.environment || 'sandbox',
        endpoint: '/api/v1/integrations/api/events',
        method: 'GET',
        statusCode: 500,
        durationMs: Date.now() - startTime,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        errorMessage: err.message,
      });
      next(err);
    }
  }

  public async createMockEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    const startTime = Date.now();
    const tenantId = req.tenantId || 'weventurehub';
    const context = (req as any).apiKeyContext || {};

    try {
      const { title, description, category, date, price } = req.body;
      if (!title) {
        res.status(400).json({ success: false, message: 'Missing event title' });
        return;
      }

      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const event = await Event.create({
        tenantId: tenantId.toLowerCase(),
        title,
        slug,
        description: description || 'No description provided.',
        category: category || 'CONFERENCE',
        status: EventStatus.PUBLISHED,
        visibility: EventVisibility.PUBLIC,
        tags: [],
        schedule: {
          startDate: date ? new Date(date) : new Date(Date.now() + 86400000 * 7),
          endDate: date ? new Date(new Date(date).getTime() + 7200000) : new Date(Date.now() + 86400000 * 7 + 7200000),
          timezone: 'UTC',
        },
        capacity: {
          maxCapacity: 100,
          activeRegistrations: 0,
          isUnlimited: false,
        },
        registrationSettings: {
          requiresApproval: false,
        },
        media: {
          bannerUrl: '',
          imageUrls: [],
        },
        seo: {
          metaKeywords: [],
        },
        createdBy: 'api_gateway',
      });

      await integrationService.logApiAnalytics({
        tenantId,
        apiKeyId: context.id,
        apiKeyName: context.name,
        environment: context.environment || 'sandbox',
        endpoint: '/api/v1/integrations/api/events',
        method: 'POST',
        statusCode: 201,
        durationMs: Date.now() - startTime,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      // Dispatch webhook to subscribers!
      await integrationService.dispatchOutboundWebhook(tenantId, 'event.created', event.toJSON());

      ApiResponse.success(res, event, 201);
    } catch (err: any) {
      await integrationService.logApiAnalytics({
        tenantId,
        apiKeyId: context.id,
        apiKeyName: context.name,
        environment: context.environment || 'sandbox',
        endpoint: '/api/v1/integrations/api/events',
        method: 'POST',
        statusCode: 500,
        durationMs: Date.now() - startTime,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        errorMessage: err.message,
      });
      next(err);
    }
  }

  public async getMockBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
    const startTime = Date.now();
    const tenantId = req.tenantId || 'weventurehub';
    const context = (req as any).apiKeyContext || {};

    try {
      const bookings = await Booking.find({ tenantId: tenantId.toLowerCase() }).limit(20);

      await integrationService.logApiAnalytics({
        tenantId,
        apiKeyId: context.id,
        apiKeyName: context.name,
        environment: context.environment || 'sandbox',
        endpoint: '/api/v1/integrations/api/bookings',
        method: 'GET',
        statusCode: 200,
        durationMs: Date.now() - startTime,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      ApiResponse.success(res, bookings);
    } catch (err: any) {
      await integrationService.logApiAnalytics({
        tenantId,
        apiKeyId: context.id,
        apiKeyName: context.name,
        environment: context.environment || 'sandbox',
        endpoint: '/api/v1/integrations/api/bookings',
        method: 'GET',
        statusCode: 500,
        durationMs: Date.now() - startTime,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        errorMessage: err.message,
      });
      next(err);
    }
  }
}
