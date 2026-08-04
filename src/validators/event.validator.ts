import { z } from 'zod';
import { EventStatus, EventVisibility } from '../types';

const SessionValidator = z.object({
  title: z.string().min(1, 'Session title is required'),
  description: z.string().optional(),
  startTime: z.string().min(1, 'Session start time is required'),
  endTime: z.string().min(1, 'Session end time is required'),
  location: z.string().optional(),
});

export const createEventSchema = z.object({
  title: z.string().min(1, 'Event title is required'),
  description: z.string().min(1, 'Event description is required'),
  category: z.string().min(1, 'Event category is required'),
  tags: z.array(z.string()).default([]),
  status: z.nativeEnum(EventStatus).default(EventStatus.DRAFT),
  visibility: z.nativeEnum(EventVisibility).default(EventVisibility.PUBLIC),
  schedule: z.object({
    startDate: z.string().datetime({ message: 'Start date must be a valid ISO datetime' }),
    endDate: z.string().datetime({ message: 'End date must be a valid ISO datetime' }),
    timezone: z.string().default('UTC'),
  }),
  capacity: z.object({
    maxCapacity: z.number().int().nonnegative().default(0),
    isUnlimited: z.boolean().default(false),
  }).default({ maxCapacity: 0, isUnlimited: true }),
  registrationSettings: z.object({
    registrationOpenDate: z.string().datetime().optional().nullable(),
    registrationCloseDate: z.string().datetime().optional().nullable(),
    requiresApproval: z.boolean().default(false),
    isInviteOnly: z.boolean().default(false),
    customFormFields: z.array(z.any()).optional().default([]),
  }).default({ requiresApproval: false, isInviteOnly: false, customFormFields: [] }),
  sessions: z.array(SessionValidator).default([]),
  media: z.object({
    bannerUrl: z.string().optional().or(z.literal('')),
    imageUrls: z.array(z.string()).default([]),
    videoUrl: z.string().optional().or(z.literal('')),
  }).default({ imageUrls: [] }),
  seo: z.object({
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    metaKeywords: z.array(z.string()).default([]),
  }).default({ metaKeywords: [] }),
  template: z.string().optional().default('default'),
  isFreeRsvp: z.boolean().optional().default(false),
  rsvpFormFields: z.array(z.any()).optional().default([]),
  rsvpFormAppearance: z.any().optional().default({}),
  modules: z.array(z.object({
    id: z.string(),
    enabled: z.boolean().default(false),
    config: z.any().default({}),
  })).optional().default([]),
});

export const updateEventSchema = createEventSchema.partial();
