import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/response';
import { RsvpConfiguration } from '../models/RsvpConfiguration';
import { Event } from '../models/Event';
import { NotFoundError, AppError } from '../errors/AppError';

export const rsvpConfigurationController = {
  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params;
      const tenantId = req.tenantId || 'weventurehub';
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(eventId);

      console.log(`[RSVP Backend] Fetching RSVP configuration for event: ${eventId}`);

      let config = await RsvpConfiguration.findOne({
        $or: [
          { eventId, tenantId },
          { eventId },
        ]
      });

      // If no separate RsvpConfiguration document yet, check Event model directly
      if (!config) {
        const event = await Event.findOne({
          $or: [
            ...(isObjectId ? [{ _id: eventId }] : []),
            { id: eventId },
            { slug: eventId }
          ]
        }).exec();

        if (event && (event.rsvpFormFields?.length || event.rsvpFormAppearance)) {
          console.log(`[RSVP Backend] Returning RSVP configuration from Event document for: ${eventId}`);
          return ApiResponse.success(res, {
            eventId: event._id.toString(),
            tenantId,
            draft: {
              fields: event.rsvpFormFields || [],
              appearance: event.rsvpFormAppearance || {},
              emailSettings: event.rsvpEmailSettings || {},
              ticketSettings: event.rsvpTicketSettings || {},
              updatedAt: event.updatedAt || new Date()
            },
            versions: [],
            publishedVersion: 1
          }, 200);
        }

        return ApiResponse.success(res, null, 200, { message: 'No RSVP configuration found' });
      }

      console.log(`[RSVP Backend] Successfully loaded RSVP configuration for event: ${eventId}, draft fields: ${config.draft?.fields?.length || 0}`);
      return ApiResponse.success(res, config, 200);
    } catch (error) {
      next(error);
    }
  },

  async saveDraft(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params;
      const tenantId = req.tenantId || 'weventurehub';
      const { fields, appearance, emailSettings, ticketSettings } = req.body;
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(eventId);

      console.log(`[RSVP Backend Save] Saving draft for event ${eventId}. Fields count: ${fields?.length || 0}`);

      let config = await RsvpConfiguration.findOne({
        $or: [
          { eventId, tenantId },
          { eventId }
        ]
      });

      if (!config) {
        config = new RsvpConfiguration({
          eventId,
          tenantId,
          draft: { fields: fields || [], appearance: appearance || {}, emailSettings: emailSettings || {}, ticketSettings: ticketSettings || {}, updatedAt: new Date() },
          versions: [],
          publishedVersion: 0
        });
      } else {
        config.draft = {
          fields: fields !== undefined ? fields : config.draft.fields,
          appearance: appearance !== undefined ? appearance : config.draft.appearance,
          emailSettings: emailSettings !== undefined ? emailSettings : config.draft.emailSettings,
          ticketSettings: ticketSettings !== undefined ? ticketSettings : config.draft.ticketSettings,
          updatedAt: new Date()
        };
      }

      await config.save();

      // Synchronize directly with Event model to guarantee immediate availability on frontend
      try {
        const updateObj: Record<string, any> = {
          ...(fields !== undefined ? { rsvpFormFields: fields } : {}),
          ...(appearance !== undefined ? { rsvpFormAppearance: appearance } : {}),
          ...(emailSettings !== undefined ? { rsvpEmailSettings: emailSettings } : {}),
          ...(ticketSettings !== undefined ? { rsvpTicketSettings: ticketSettings } : {})
        };

        if (appearance?.bannerUrl || appearance?.headerImage) {
          updateObj['media.bannerUrl'] = appearance.bannerUrl || appearance.headerImage;
        }

        await Event.updateOne(
          {
            $or: [
              ...(isObjectId ? [{ _id: eventId }] : []),
              { id: eventId },
              { slug: eventId }
            ]
          },
          {
            $set: updateObj
          }
        );
        console.log(`[RSVP Backend Save] Synced RSVP configuration and banner to Event document for event: ${eventId}`);
      } catch (syncErr) {
        console.warn(`[RSVP Backend Save] Warning: Could not sync to Event document:`, syncErr);
      }

      return ApiResponse.success(res, config, 200, { message: 'Draft saved successfully' });
    } catch (error) {
      next(error);
    }
  },

  async publish(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params;
      const tenantId = req.tenantId || 'weventurehub';
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(eventId);

      console.log(`[RSVP Backend Publish] Publishing RSVP configuration for event: ${eventId}`);

      const event = await Event.findOne({
        $or: [
          ...(isObjectId ? [{ _id: eventId }] : []),
          { id: eventId },
          { slug: eventId }
        ]
      });

      if (!event) {
        throw new AppError('Event not found', 404, 'NOT_FOUND');
      }

      let config = await RsvpConfiguration.findOne({
        $or: [
          { eventId, tenantId },
          { eventId },
          { eventId: event._id.toString() }
        ]
      });

      if (!config) {
        // Create configuration from event if not existing
        config = new RsvpConfiguration({
          eventId: event._id.toString(),
          tenantId,
          draft: {
            fields: event.rsvpFormFields || [],
            appearance: event.rsvpFormAppearance || {},
            emailSettings: event.rsvpEmailSettings || {},
            ticketSettings: event.rsvpTicketSettings || {},
            updatedAt: new Date()
          },
          versions: [],
          publishedVersion: 0
        });
      }

      if (!config.draft.fields || config.draft.fields.length === 0) {
        throw new AppError('Form has required fields configured validation failed: No fields added.', 400, 'VALIDATION_ERROR');
      }

      const newVersionNumber = (config.versions?.length || 0) + 1;

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

      // Synchronize with Event document
      event.rsvpFormFields = config.draft.fields;
      if (config.draft.appearance) {
        event.rsvpFormAppearance = config.draft.appearance;
        if (config.draft.appearance.bannerUrl || config.draft.appearance.headerImage) {
          if (!event.media) {
            event.media = { bannerUrl: config.draft.appearance.bannerUrl || config.draft.appearance.headerImage, imageUrls: [] };
          } else {
            event.media.bannerUrl = config.draft.appearance.bannerUrl || config.draft.appearance.headerImage;
          }
        }
      }
      if (config.draft.emailSettings) event.rsvpEmailSettings = config.draft.emailSettings;
      if (config.draft.ticketSettings) event.rsvpTicketSettings = config.draft.ticketSettings;
      await event.save();

      console.log(`[RSVP Backend Publish] Published version ${newVersionNumber} for event: ${eventId}`);
      return ApiResponse.success(res, config, 200, { message: 'Published successfully' });
    } catch (error) {
      next(error);
    }
  },

  async restore(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId, version } = req.params;
      const tenantId = req.tenantId || 'weventurehub';
      const versionNumber = parseInt(version, 10);
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(eventId);

      let config = await RsvpConfiguration.findOne({
        $or: [
          { eventId, tenantId },
          { eventId }
        ]
      });

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

      // Synchronize with Event document
      await Event.updateOne(
        {
          $or: [
            ...(isObjectId ? [{ _id: eventId }] : []),
            { id: eventId },
            { slug: eventId }
          ]
        },
        {
          $set: {
            rsvpFormFields: targetVersion.fields,
            rsvpFormAppearance: targetVersion.appearance,
            rsvpEmailSettings: targetVersion.emailSettings,
            rsvpTicketSettings: targetVersion.ticketSettings
          }
        }
      );

      return ApiResponse.success(res, config, 200, { message: `Restored to version ${versionNumber}` });
    } catch (error) {
      next(error);
    }
  }
};
