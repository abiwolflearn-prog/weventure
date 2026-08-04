import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/response';
import { RsvpConfiguration } from '../models/RsvpConfiguration';
import { Event } from '../models/Event';
import { NotFoundError, AppError } from '../errors/AppError';

export const rsvpConfigurationController = {
  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params;
      const tenantId = req.tenantId;

      let config = await RsvpConfiguration.findOne({ eventId, tenantId });

      if (!config) {
        return ApiResponse.success(res, null, 200, { message: 'No RSVP configuration found' });
      }

      return ApiResponse.success(res, config, 200);
    } catch (error) {
      next(error);
    }
  },

  async saveDraft(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params;
      const tenantId = req.tenantId;
      const { fields, appearance, emailSettings, ticketSettings } = req.body;

      let config = await RsvpConfiguration.findOne({ eventId, tenantId });

      if (!config) {
        config = new RsvpConfiguration({
          eventId,
          tenantId,
          draft: { fields, appearance, emailSettings, ticketSettings, updatedAt: new Date() },
          versions: [],
          publishedVersion: 0
        });
      } else {
        config.draft = {
          fields: fields || config.draft.fields,
          appearance: appearance || config.draft.appearance,
          emailSettings: emailSettings || config.draft.emailSettings,
          ticketSettings: ticketSettings || config.draft.ticketSettings,
          updatedAt: new Date()
        };
      }

      await config.save();
      return ApiResponse.success(res, config, 200, { message: 'Draft saved successfully' });
    } catch (error) {
      next(error);
    }
  },

  async publish(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params;
      const tenantId = req.tenantId;

      const event = await Event.findOne({ _id: eventId, tenantId });
      if (!event) {
        throw new AppError('Event not found', 404, 'NOT_FOUND');
      }

      if (!event.title) {
        throw new AppError('Form title exists validation failed: Event title is required.', 400, 'VALIDATION_ERROR');
      }

      if (!event.slug) {
        throw new AppError('Public URL slug is invalid or missing.', 400, 'VALIDATION_ERROR');
      }

      const duplicateSlug = await Event.findOne({ slug: event.slug, tenantId, _id: { $ne: eventId } });
      if (duplicateSlug) {
        throw new AppError('No duplicate slug exists validation failed: Slug already in use.', 400, 'VALIDATION_ERROR');
      }

      const config = await RsvpConfiguration.findOne({ eventId, tenantId });

      if (!config) {
        throw new NotFoundError('RSVP configuration not found');
      }

      if (!config.draft.fields || config.draft.fields.length === 0) {
        throw new AppError('Form has required fields configured validation failed: No fields added.', 400, 'VALIDATION_ERROR');
      }

      const newVersionNumber = config.versions.length + 1;

      config.versions.push({
        versionNumber: newVersionNumber,
        fields: config.draft.fields,
        appearance: config.draft.appearance,
        emailSettings: config.draft.emailSettings,
        ticketSettings: config.draft.ticketSettings,
        createdAt: new Date()
      });

      config.publishedVersion = newVersionNumber;
      await config.save();

      return ApiResponse.success(res, config, 200, { message: 'Published successfully' });
    } catch (error) {
      next(error);
    }
  },

  async restore(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId, version } = req.params;
      const tenantId = req.tenantId;
      const versionNumber = parseInt(version, 10);

      const config = await RsvpConfiguration.findOne({ eventId, tenantId });

      if (!config) {
        throw new NotFoundError('RSVP configuration not found');
      }

      const targetVersion = config.versions.find(v => v.versionNumber === versionNumber);
      if (!targetVersion) {
        throw new NotFoundError('Version not found');
      }

      config.draft = {
        fields: targetVersion.fields,
        appearance: targetVersion.appearance,
        emailSettings: targetVersion.emailSettings,
        ticketSettings: targetVersion.ticketSettings,
        updatedAt: new Date()
      };

      await config.save();

      return ApiResponse.success(res, config, 200, { message: `Restored to version ${versionNumber}` });
    } catch (error) {
      next(error);
    }
  }
};
