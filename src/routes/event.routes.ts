import { Router } from 'express';
import { eventController } from '../controllers/EventController';
import { authGuard } from '../middleware/authGuard';
import { hasRoles, hasPermission } from '../middleware/roleGuard';
import { validateRequest } from '../middleware/requestValidator';
import { createEventSchema, updateEventSchema } from '../validators/event.validator';
import { Permission, UserRole } from '../types';

const eventRouter = Router();

/**
 * @route   GET /api/v1/events
 * @desc    Fetch lists of active, filtered, or searched event listings
 * @access  Public / Tenant Isolation Enforced
 */
eventRouter.get('/', eventController.list);

/**
 * @route   GET /api/v1/events/categories
 * @desc    Fetch distinct list of categories inside the tenant context
 * @access  Public
 */
eventRouter.get('/categories', eventController.getCategories);

/**
 * @route   GET /api/v1/events/tags
 * @desc    Fetch distinct list of tags inside the tenant context
 * @access  Public
 */
eventRouter.get('/tags', eventController.getTags);

/**
 * @route   GET /api/v1/events/logs
 * @desc    Fetch security and operational audit logs
 * @access  Private (Admins Only)
 */
eventRouter.get(
  '/logs',
  authGuard,
  hasRoles([UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN]),
  eventController.getAuditLogs
);

/**
 * @route   GET /api/v1/events/id/:id
 * @desc    Retrieve core event specification by resource ID
 * @access  Public / Context Isolated
 */
eventRouter.get('/id/:id', eventController.getById);

/**
 * @route   GET /api/v1/events/slug/:slug
 * @desc    Retrieve core event specification by URL SEO slug
 * @access  Public / Context Isolated
 */
eventRouter.get('/slug/:slug', eventController.getBySlug);

/**
 * @route   POST /api/v1/events
 * @desc    Establish a new core event draft or published page
 * @access  Private (Requires events:create permission)
 */
eventRouter.post(
  '/',
  authGuard,
  hasPermission(Permission.EVENTS_CREATE),
  validateRequest({ body: createEventSchema }),
  eventController.create
);

/**
 * @route   PUT /api/v1/events/:id
 * @desc    Modify specifications of an existing event
 * @access  Private (Requires events:update permission)
 */
eventRouter.put(
  '/:id',
  authGuard,
  hasPermission(Permission.EVENTS_UPDATE),
  validateRequest({ body: updateEventSchema }),
  eventController.update
);

/**
 * @route   DELETE /api/v1/events/:id
 * @desc    Purge a core event from the system
 * @access  Private (Requires events:delete permission)
 */
eventRouter.delete(
  '/:id',
  authGuard,
  hasPermission(Permission.EVENTS_DELETE),
  eventController.delete
);

/**
 * @route   PATCH /api/v1/events/:id/publish
 * @desc    Alter state of draft event to PUBLISHED
 * @access  Private (Requires events:update permission)
 */
eventRouter.patch(
  '/:id/publish',
  authGuard,
  hasPermission(Permission.EVENTS_UPDATE),
  eventController.publish
);

/**
 * @route   PATCH /api/v1/events/:id/cancel
 * @desc    Alter state of published event to CANCELLED
 * @access  Private (Requires events:update permission)
 */
eventRouter.patch(
  '/:id/cancel',
  authGuard,
  hasPermission(Permission.EVENTS_UPDATE),
  eventController.cancel
);

export default eventRouter;
