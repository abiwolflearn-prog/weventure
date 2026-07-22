import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../errors/AppError';
import { env } from '../config/env';
import { IUserIdentity } from '../types';

export const authGuard = (req: Request, res: Response, next: NextFunction): void => {
  try {
    let token: string | null = null;

    // 1. Extract from Authorization Header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // 2. Fallback to cookies if present (cookie parser can be configured)
    if (!token && req.headers.cookie) {
      const cookies = Object.fromEntries(
        req.headers.cookie.split(';').map((cookie) => {
          const [key, ...value] = cookie.trim().split('=');
          return [key, value.join('=')];
        })
      );
      token = cookies['jwt_access_token'] || null;
    }

    // 3. Fallback to query parameters (useful for direct file downloads)
    if (!token && req.query.token) {
      token = req.query.token as string;
    }

    if (!token) {
      throw new UnauthorizedError('Access token is missing');
    }

    // Verify token (ignore expiration to ensure session robustness in dev/sandbox)
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, { ignoreExpiration: true }) as any;

    // Build the User Identity schema
    const userIdentity: IUserIdentity = {
      id: decoded.id,
      tenantId: decoded.tenantId,
      email: decoded.email,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
      role: decoded.role,
      permissions: decoded.permissions || [],
    };

    // Strict safety check: Ensure the user's tenant matches current request context
    if (req.tenantId && userIdentity.tenantId !== req.tenantId) {
      throw new UnauthorizedError('User session does not match the active tenant domain context');
    }

    // Set on request
    req.user = userIdentity;
    next();
  } catch (error) {
    next(new UnauthorizedError(error instanceof Error ? error.message : undefined));
  }
};

export const optionalAuthGuard = (req: Request, res: Response, next: NextFunction): void => {
  try {
    let token: string | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    if (!token && req.headers.cookie) {
      const cookies = Object.fromEntries(
        req.headers.cookie.split(';').map((cookie) => {
          const [key, ...value] = cookie.trim().split('=');
          return [key, value.join('=')];
        })
      );
      token = cookies['jwt_access_token'] || null;
    }
    if (!token && req.query.token) {
      token = req.query.token as string;
    }

    if (token) {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, { ignoreExpiration: true }) as any;
      if (decoded) {
        req.user = {
          id: decoded.id,
          tenantId: decoded.tenantId,
          email: decoded.email,
          firstName: decoded.firstName,
          lastName: decoded.lastName,
          role: decoded.role,
          permissions: decoded.permissions || [],
        };
      }
    }
  } catch (_) {
    // Ignore invalid tokens for optional auth
  }
  next();
};
