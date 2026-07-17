import { z } from 'zod';
import { EventStatus, EventVisibility } from '../types';

const SessionValidator = z.object({
  title: z.string().min(1, 'Session title is required'),
  description: z.string().optional(),
  startTime: z.string().datetime({ message: 'Session start time must be a valid ISO datetime' }),
  endTime: z.string().datetime({ message: 'Session end time must be a valid ISO datetime' }),
  location: z.string().optional(),
});

export const createEventSchema = z.object({
  title: z.string().min(3, 'Event title must be at least 3 characters long'),
  description: z.string().min(10, 'Event description must be at least 10 characters long'),
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
    registrationOpenDate: z.string().datetime().optional(),
    registrationCloseDate: z.string().datetime().optional(),
    requiresApproval: z.boolean().default(false),
  }).default({ requiresApproval: false }),
  sessions: z.array(SessionValidator).default([]),
  media: z.object({
    bannerUrl: z.string().url('Banner must be a valid URL').optional().or(z.literal('')),
    imageUrls: z.array(z.string().url('Image must be a valid URL')).default([]),
    videoUrl: z.string().url('Video must be a valid URL').optional().or(z.literal('')),
  }).default({ imageUrls: [] }),
  seo: z.object({
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    metaKeywords: z.array(z.string()).default([]),
  }).default({ metaKeywords: [] }),
  template: z.string().optional().default('default'),
  modules: z.array(z.object({
    id: z.string(),
    enabled: z.boolean().default(false),
    config: z.any().default({}),
  })).optional().default([]),
});

export const updateEventSchema = createEventSchema.partial();
