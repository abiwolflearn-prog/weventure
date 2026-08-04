const fs = require('fs');

let content = fs.readFileSync('src/controllers/RsvpConfigurationController.ts', 'utf-8');

if (!content.includes('import { Event }')) {
  content = content.replace("import { NotFoundError, AppError }", "import { Event } from '../models/Event';\nimport { NotFoundError, AppError }");
}

const newPublishMethod = `
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
`;

content = content.replace(/async publish\(req: Request, res: Response, next: NextFunction\) \{[\s\S]*?async restore\(req: Request, res: Response, next: NextFunction\) \{/, newPublishMethod.trim() + "\n\n  async restore(req: Request, res: Response, next: NextFunction) {");

fs.writeFileSync('src/controllers/RsvpConfigurationController.ts', content);
