import { EmailQueue } from '../models/EmailQueue';
import { emailService } from './EmailService';
import { logger } from '../utils/logger';

class EmailQueueProcessor {
  private isProcessing = false;
  private timer: NodeJS.Timeout | null = null;

  public start(intervalMs = 5000) {
    if (this.timer) return;
    logger.info(`⚙️ Email Queue Processor started (interval: ${intervalMs}ms)`);
    this.timer = setInterval(() => this.processNextBatch(), intervalMs);
    // Trigger initial run immediately
    this.processNextBatch();
  }

  public stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      logger.info('🛑 Email Queue Processor stopped');
    }
  }

  public async processNextBatch(batchSize = 10) {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const now = new Date();
      // Find pending or failed retriable items scheduled for <= now
      const items = await (EmailQueue as any).find({
        status: { $in: ['pending', 'failed'] },
        scheduledFor: { $lte: now },
        $expr: { $lt: ['$attempts', '$maxAttempts'] },
      })
        .sort({ priority: -1, scheduledFor: 1 })
        .limit(batchSize);

      if (items.length === 0) {
        this.isProcessing = false;
        return;
      }

      logger.info(`⚙️ Processing ${items.length} queued email items...`);

      for (const item of items) {
        // Mark as processing
        item.status = 'processing';
        item.attempts += 1;
        await item.save();

        const success = await emailService.sendEmail({
          to: item.recipientEmail,
          recipientName: item.recipientName,
          subject: item.subject,
          html: item.bodyHtml,
          category: item.metadata?.category || 'booking',
          templateKey: item.templateKey,
          tenantId: item.tenantId,
        });

        if (success) {
          item.status = 'sent';
          item.sentAt = new Date();
          item.lastError = undefined;
        } else {
          item.status = item.attempts >= item.maxAttempts ? 'failed' : 'pending';
          item.lastError = `Failed attempt ${item.attempts}/${item.maxAttempts}`;
        }
        await item.save();
      }
    } catch (error) {
      logger.error('❌ Error inside EmailQueueProcessor:', error);
    } finally {
      this.isProcessing = false;
    }
  }
}

export const emailQueueProcessor = new EmailQueueProcessor();
