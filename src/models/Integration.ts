import mongoose, { Schema, Document } from 'mongoose';

// 1. API Key
export interface IApiKeyDocument extends Document {
  tenantId: string;
  name: string;
  key: string; // hashed key
  secretPrefix: string; // e.g. wvh_live_...
  maskedKey: string; // e.g. wvh_live_abc...xyz
  environment: 'sandbox' | 'production';
  status: 'active' | 'revoked';
  rateLimit: number; // requests per minute, e.g. 100
  ipWhitelist: string[];
  lastUsedAt?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const ApiKeySchema = new Schema<IApiKeyDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    key: { type: String, required: true, unique: true },
    secretPrefix: { type: String, required: true },
    maskedKey: { type: String, required: true },
    environment: { type: String, required: true, enum: ['sandbox', 'production'], default: 'sandbox' },
    status: { type: String, required: true, enum: ['active', 'revoked'], default: 'active' },
    rateLimit: { type: Number, required: true, default: 100 },
    ipWhitelist: [{ type: String }],
    lastUsedAt: { type: Date },
    createdBy: { type: String, required: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret: any) => {
        ret.id = ret._id ? ret._id.toString() : '';
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const ApiKey = mongoose.model<IApiKeyDocument>('ApiKey', ApiKeySchema);

// 2. Webhook Subscription (Outbound Webhooks)
export interface IWebhookSubscriptionDocument extends Document {
  tenantId: string;
  name: string;
  url: string;
  secret: string; // HMAC SHA-256 secret key
  events: string[]; // e.g., ['ticket.purchased', 'payment.completed']
  enabled: boolean;
  environment: 'sandbox' | 'production';
  apiVersion: string; // e.g. 'v1'
  rateLimit: number;
  ipWhitelist: string[];
  retryConfig: {
    maxAttempts: number;
    backoffMultiplier: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const WebhookSubscriptionSchema = new Schema<IWebhookSubscriptionDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    url: { type: String, required: true },
    secret: { type: String, required: true },
    events: [{ type: String, required: true }],
    enabled: { type: Boolean, default: true },
    environment: { type: String, required: true, enum: ['sandbox', 'production'], default: 'sandbox' },
    apiVersion: { type: String, default: 'v1' },
    rateLimit: { type: Number, default: 120 },
    ipWhitelist: [{ type: String }],
    retryConfig: {
      maxAttempts: { type: Number, default: 5 },
      backoffMultiplier: { type: Number, default: 2 },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret: any) => {
        ret.id = ret._id ? ret._id.toString() : '';
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const WebhookSubscription = mongoose.model<IWebhookSubscriptionDocument>(
  'WebhookSubscription',
  WebhookSubscriptionSchema
);

// 3. Webhook Delivery Log (Both Outbound Attempts and Inbound Requests)
export interface IWebhookDeliveryLogDocument extends Document {
  tenantId: string;
  direction: 'inbound' | 'outbound';
  subscriptionId?: string; // only for outbound
  eventId: string; // deduplication ID
  eventType: string;
  source: string; // 'WeVentureHub' or 'Partner' or third-party service names
  url: string; // target URL for outbound, request url for inbound
  payload: Record<string, any>;
  headers: Record<string, any>;
  status: 'pending' | 'success' | 'failed' | 'retrying';
  statusCode?: number;
  responseBody?: string;
  errorMessage?: string;
  attemptCount: number;
  maxAttempts: number;
  nextAttemptAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WebhookDeliveryLogSchema = new Schema<IWebhookDeliveryLogDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    direction: { type: String, required: true, enum: ['inbound', 'outbound'], index: true },
    subscriptionId: { type: String, index: true },
    eventId: { type: String, required: true, unique: true, index: true },
    eventType: { type: String, required: true, index: true },
    source: { type: String, required: true, default: 'WeVentureHub' },
    url: { type: String, required: true },
    payload: { type: Schema.Types.Mixed, required: true },
    headers: { type: Schema.Types.Mixed },
    status: { type: String, required: true, enum: ['pending', 'success', 'failed', 'retrying'], default: 'pending', index: true },
    statusCode: { type: Number },
    responseBody: { type: String },
    errorMessage: { type: String },
    attemptCount: { type: Number, default: 1 },
    maxAttempts: { type: Number, default: 5 },
    nextAttemptAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret: any) => {
        ret.id = ret._id ? ret._id.toString() : '';
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound index to guarantee multi-tenant deduplication and swift loading
WebhookDeliveryLogSchema.index({ tenantId: 1, eventId: 1 });

export const WebhookDeliveryLog = mongoose.model<IWebhookDeliveryLogDocument>(
  'WebhookDeliveryLog',
  WebhookDeliveryLogSchema
);

// 4. OAuth Application (Registered developer client IDs)
export interface IOAuthAppDocument extends Document {
  tenantId: string;
  name: string;
  description?: string;
  clientId: string;
  clientSecret: string;
  redirectUris: string[];
  homepageUrl?: string;
  scopes: string[];
  status: 'active' | 'suspended';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const OAuthAppSchema = new Schema<IOAuthAppDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    clientId: { type: String, required: true, unique: true, index: true },
    clientSecret: { type: String, required: true },
    redirectUris: [{ type: String, required: true }],
    homepageUrl: { type: String },
    scopes: [{ type: String, default: ['read', 'write'] }],
    status: { type: String, required: true, enum: ['active', 'suspended'], default: 'active' },
    createdBy: { type: String, required: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret: any) => {
        ret.id = ret._id ? ret._id.toString() : '';
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const OAuthApp = mongoose.model<IOAuthAppDocument>('OAuthApp', OAuthAppSchema);

// 5. Connected App Marketplace integration authorization credentials
export interface IConnectedAppDocument extends Document {
  tenantId: string;
  appId: string; // e.g. 'slack', 'salesforce', 'hubspot', 'stripe', 'mailchimp'
  appName: string;
  enabled: boolean;
  credentials: Record<string, any>; // encrypted tokens, channel configuration, hooks
  settings: Record<string, any>;
  lastSyncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ConnectedAppSchema = new Schema<IConnectedAppDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    appId: { type: String, required: true, index: true },
    appName: { type: String, required: true },
    enabled: { type: Boolean, default: false },
    credentials: { type: Schema.Types.Mixed, default: {} },
    settings: { type: Schema.Types.Mixed, default: {} },
    lastSyncedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret: any) => {
        ret.id = ret._id ? ret._id.toString() : '';
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const ConnectedApp = mongoose.model<IConnectedAppDocument>('ConnectedApp', ConnectedAppSchema);

// 6. Automation Engine Rules
export interface IAutomationRuleDocument extends Document {
  tenantId: string;
  name: string;
  triggerEvent: string; // e.g., 'ticket.purchased'
  conditions: {
    field: string;
    operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'exists';
    value: string;
  }[];
  actionType: 'webhook' | 'slack_notify' | 'email' | 'push_notify';
  actionConfig: Record<string, any>; // details for the action
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AutomationRuleSchema = new Schema<IAutomationRuleDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    triggerEvent: { type: String, required: true, index: true },
    conditions: [
      {
        field: { type: String, required: true },
        operator: { type: String, required: true, enum: ['equals', 'greater_than', 'less_than', 'contains', 'exists'] },
        value: { type: String },
      },
    ],
    actionType: { type: String, required: true, enum: ['webhook', 'slack_notify', 'email', 'push_notify'] },
    actionConfig: { type: Schema.Types.Mixed, required: true },
    enabled: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret: any) => {
        ret.id = ret._id ? ret._id.toString() : '';
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const AutomationRule = mongoose.model<IAutomationRuleDocument>('AutomationRule', AutomationRuleSchema);

// 7. API Analytics Log (For charts, throughput, latency, and keys usage mapping)
export interface IApiAnalyticsLogDocument extends Document {
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
  timestamp: Date;
}

const ApiAnalyticsLogSchema = new Schema<IApiAnalyticsLogDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    apiKeyId: { type: String, index: true },
    apiKeyName: { type: String },
    environment: { type: String, required: true, enum: ['sandbox', 'production'], default: 'sandbox', index: true },
    endpoint: { type: String, required: true, index: true },
    method: { type: String, required: true },
    statusCode: { type: Number, required: true, index: true },
    durationMs: { type: Number, required: true },
    ipAddress: { type: String },
    userAgent: { type: String },
    errorMessage: { type: String },
    timestamp: { type: Date, default: Date.now, required: true, index: true },
  },
  {
    timestamps: false,
    toJSON: {
      virtuals: true,
      transform: (_, ret: any) => {
        ret.id = ret._id ? ret._id.toString() : '';
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const ApiAnalyticsLog = mongoose.model<IApiAnalyticsLogDocument>('ApiAnalyticsLog', ApiAnalyticsLogSchema);
