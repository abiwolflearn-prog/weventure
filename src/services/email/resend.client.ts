import { Resend } from 'resend';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';

let resendInstance: Resend | null = null;

/**
 * Lazy getter for Resend client.
 * Returns null if RESEND_API_KEY is not configured in environment variables.
 */
export function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY || env.RESEND_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    return null;
  }

  if (!resendInstance) {
    try {
      resendInstance = new Resend(apiKey.trim());
      logger.info('📧 Resend client successfully initialized');
    } catch (error: any) {
      logger.error('❌ Failed to initialize Resend client:', error.message || error);
      return null;
    }
  }

  return resendInstance;
}

/**
 * Check if Resend email service is active
 */
export function isResendEnabled(): boolean {
  return getResendClient() !== null;
}
