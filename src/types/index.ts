/**
 * WeVentureHub Enterprise Type Definitions
 */

// User Roles
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  TENANT_ADMIN = 'TENANT_ADMIN',
  STAFF = 'STAFF',
  HUB_MEMBER = 'HUB_MEMBER',
  EXTERNAL_USER = 'EXTERNAL_USER',
}

// Permissions for RBAC
export enum Permission {
  // User Management
  USERS_CREATE = 'users:create',
  USERS_READ = 'users:read',
  USERS_UPDATE = 'users:update',
  USERS_DELETE = 'users:delete',

  // Workspace Management
  WORKSPACES_CREATE = 'workspaces:create',
  WORKSPACES_READ = 'workspaces:read',
  WORKSPACES_UPDATE = 'workspaces:update',
  WORKSPACES_DELETE = 'workspaces:delete',

  // Bookings
  BOOKINGS_CREATE = 'bookings:create',
  BOOKINGS_READ = 'bookings:read',
  BOOKINGS_UPDATE = 'bookings:update',
  BOOKINGS_DELETE = 'bookings:delete',

  // Events
  EVENTS_CREATE = 'events:create',
  EVENTS_READ = 'events:read',
  EVENTS_UPDATE = 'events:update',
  EVENTS_DELETE = 'events:delete',

  // Analytics & Reports
  ANALYTICS_READ = 'analytics:read',

  // Settings & System config
  SETTINGS_UPDATE = 'settings:update',
}

// Session Identity Context
export interface IUserIdentity {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  permissions: Permission[];
}

// API Standard Response interfaces
export interface IApiResponseSingle<T> {
  success: boolean;
  timestamp: string;
  data: T;
  metadata?: {
    version?: string;
    traceId?: string;
    [key: string]: any;
  };
}

export interface IPaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface IApiResponsePaginated<T> {
  success: boolean;
  timestamp: string;
  data: T[];
  pagination: IPaginationMeta;
  metadata?: {
    version?: string;
    traceId?: string;
    [key: string]: any;
  };
}

export interface IApiErrorDetails {
  field?: string;
  issue: string;
}

export interface IApiErrorResponse {
  success: boolean;
  timestamp: string;
  error: {
    code: string;
    message: string;
    details?: IApiErrorDetails[];
  };
  metadata?: {
    traceId?: string;
    [key: string]: any;
  };
}

// Workspace Item Entity type
export interface IWorkspace {
  id: string;
  tenantId: string;
  name: string;
  type: 'HOT_DESK' | 'MEETING_ROOM' | 'EVENT_VENUE';
  capacity: number;
  hourlyRate: number;
  currency: string;
  amenities: string[];
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

// Booking Entity type
export interface IBooking {
  id: string;
  tenantId: string;
  userId: string;
  spaceId: string;
  startTime: string;
  endTime: string;
  totalAmount: number;
  status: 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

// Event Lifecycle Enums
export enum EventStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

// Event Visibility Enums
export enum EventVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  UNLISTED = 'UNLISTED',
}

// Multi-Session Structure
export interface IEventSession {
  id?: string;
  _id?: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
}

export interface ICustomFormField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'checkbox' | 'select' | 'file';
  required: boolean;
  options?: string[];
  conditionalShow?: {
    fieldId: string;
    value: string;
  };
}

export interface IEventModule {
  id: string;
  enabled: boolean;
  config: Record<string, any>;
}

// Core Event Entity interface
export interface IEvent {
  id: string;
  _id?: string;
  tenantId: string;
  title: string;
  slug: string;
  description: string;
  status: EventStatus;
  visibility: EventVisibility;
  category: string;
  tags: string[];
  schedule: {
    startDate: string;
    endDate: string;
    timezone: string;
  };
  capacity: {
    maxCapacity: number;
    activeRegistrations: number;
    isUnlimited: boolean;
  };
  registrationSettings: {
    registrationOpenDate?: string;
    registrationCloseDate?: string;
    requiresApproval: boolean;
    isInviteOnly?: boolean;
    customFormFields?: ICustomFormField[];
  };
  sessions: IEventSession[];
  media: {
    bannerUrl?: string;
    imageUrls: string[];
    videoUrl?: string;
  };
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords: string[];
  };
  template?: string;
  modules?: IEventModule[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Audit Log Interface
export interface IAuditLog {
  id: string;
  tenantId: string;
  userId: string;
  userEmail: string;
  action: string;
  resourceType: 'EVENT' | 'WORKSPACE' | 'BOOKING' | 'TICKET' | 'REGISTRATION' | 'ORDER';
  resourceId: string;
  details?: Record<string, any>;
  timestamp: string;
}

// Ticket Type Interface
export enum TicketVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  UNLISTED = 'UNLISTED',
}

export enum TicketStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export interface ITicketType {
  id: string;
  tenantId: string;
  eventId: string;
  name: string;
  description?: string;
  price: number; // 0 = Free
  currency: string;
  capacity: {
    maxQuantity: number;
    soldQuantity: number;
    isUnlimited: boolean;
  };
  availability: {
    salesStart?: string | Date;
    salesEnd?: string | Date;
  };
  settings: {
    minOrderQty: number;
    maxOrderQty: number;
    visibility: TicketVisibility;
  };
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
}

// Order Status Enums
export enum OrderStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum OrderType {
  EVENT_TICKET = 'EVENT_TICKET',
  WORKSPACE_BOOKING = 'WORKSPACE_BOOKING',
  HOT_DESK = 'HOT_DESK',
  PRIVATE_OFFICE = 'PRIVATE_OFFICE',
  MEETING_ROOM = 'MEETING_ROOM',
  MEMBERSHIP = 'MEMBERSHIP',
  TRAINING = 'TRAINING',
  PROGRAM = 'PROGRAM',
  CERTIFICATE = 'CERTIFICATE',
  MERCHANDISE = 'MERCHANDISE',
  CONSULTING = 'CONSULTING',
  SPONSORSHIP = 'SPONSORSHIP'
}

export interface IOrderItem {
  ticketTypeId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface IOrder {
  id: string;
  tenantId: string;
  userId: string;
  userEmail: string;
  orderType?: OrderType;
  eventId?: string;
  itemId?: string;
  tickets: IOrderItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentDetails?: {
    method?: string;
    reference?: string;
  };
  orderDate: string;
  createdAt: string;
  updatedAt: string;
}

// Registration Status
export enum RegistrationStatus {
  CONFIRMED = 'CONFIRMED',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  CANCELLED = 'CANCELLED',
  WAITLISTED = 'WAITLISTED',
}

export interface IRegistration {
  id: string;
  tenantId: string;
  userId: string;
  userEmail: string;
  eventId: string;
  orderId?: string; // Optional for waitlists or direct free bookings
  ticketTypeId?: string;
  ticketNumber: string; // WH-EVENT_ID-XXXXX
  qrCode: string; // Mapped code representation
  attendeeName: string;
  attendeeEmail: string;
  status: RegistrationStatus;
  checkedIn: boolean;
  checkedInAt?: string;
  registrationDate: string;
  customAnswers?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// Waitlist Status
export enum WaitlistStatus {
  WAITLISTED = 'WAITLISTED',
  PROMOTED = 'PROMOTED',
  LEFT = 'LEFT',
}

export interface IWaitlist {
  id: string;
  tenantId: string;
  eventId: string;
  ticketTypeId?: string;
  userId: string;
  userEmail: string;
  name: string;
  status: WaitlistStatus;
  joinedAt: string;
  promotedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export * from './tenant';


