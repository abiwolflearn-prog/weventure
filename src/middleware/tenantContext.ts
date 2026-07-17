import { Request, Response, NextFunction } from 'express';
import { NotFoundError } from '../errors/AppError';

/**
 * Extracts and sets tenantId from headers or subdomains
 */
export const tenantContext = (req: Request, res: Response, next: NextFunction): void => {
  // 1. Check for Custom Header
  let tenantId = req.headers['x-tenant-id'] as string;

  // 2. Subdomain resolution fallback (e.g., tenant.weventurehub.com)
  if (!tenantId && req.headers.host) {
    const parts = req.headers.host.split('.');
    if (parts.length > 2) {
      tenantId = parts[0];
    }
  }

  // 3. Fallback to default platform context if nothing is supplied
  // In a highly strict enterprise environment, we would throw NotFoundError
  // Here we fallback to 'weventurehub' to ease initial workspace onboarding.
  if (!tenantId) {
    tenantId = 'weventurehub';
  }

  // Bind tenant identifier securely to request context
  req.tenantId = tenantId.toLowerCase();

  // Set response headers for verification
  res.setHeader('X-Tenant-ID', req.tenantId);

  next();
};
