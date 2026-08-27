import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../errors/AppError';
import { env } from '../config/env';
import { IUserIdentity, UserRole, Permission } from '../types';
import { User } from '../models/User';
import { ROLE_PERMISSIONS } from '../controllers/AuthController';

export const authGuard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | null = null;

    // 1. Extract from Authorization Header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // 2. Fallback to cookies if present
    if (!token && req.headers.cookie) {
      const cookies = Object.fromEntries(
        req.headers.cookie.split(';').map((cookie) => {
          const [key, ...value] = cookie.trim().split('=');
          return [key, value.join('=')];
        })
      );
      token = cookies['jwt_access_token'] || null;
    }

    // 3. Fallback to query parameter (e.g. for downloads/webhooks)
    if (!token && req.query.token) {
      token = req.query.token as string;
    }

    if (token === 'undefined' || token === 'null' || !token?.trim()) {
      token = null;
    }

    if (!token) {
      throw new UnauthorizedError('Access token is missing. Please log in to continue.');
    }

    // Verify token with signature and expiration checks
    let decoded: any;
    try {
      decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    } catch (jwtErr: any) {
      if (jwtErr.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Your session has expired. Please log in again.');
      }
      throw new UnauthorizedError('Invalid access token. Authentication failed.');
    }

    if (!decoded || (!decoded.id && !decoded.email)) {
      throw new UnauthorizedError('Malformed access token');
    }

    // Fetch user from DB to verify active account and get authoritative role
    let dbUser: any = null;
    if (decoded.id && decoded.id.length === 24) {
      dbUser = await (User as any).findById(decoded.id).select('-passwordHash').lean();
    }
    if (!dbUser && decoded.email) {
      const cleanEmail = String(decoded.email).toLowerCase().trim();
      dbUser = await (User as any).findOne({ email: cleanEmail }).select('-passwordHash').lean();
    }

    if (!dbUser) {
      throw new UnauthorizedError('User account not found or access has been revoked.');
    }

    // Authoritative role from database
    const rawRole = String(dbUser.role || '').toUpperCase();
    const effectiveRole: UserRole =
      rawRole === 'ADMIN' ? UserRole.TENANT_ADMIN :
      rawRole === 'SUPER_ADMIN' ? UserRole.SUPER_ADMIN :
      rawRole === 'TENANT_ADMIN' ? UserRole.TENANT_ADMIN :
      rawRole === 'STAFF' ? UserRole.STAFF :
      (rawRole as UserRole) || UserRole.HUB_MEMBER;

    const permissions = ROLE_PERMISSIONS[effectiveRole] || Object.values(Permission);

    // Build the verified User Identity
    const userIdentity: IUserIdentity = {
      id: dbUser._id.toString(),
      tenantId: 'weventurehub',
      email: dbUser.email,
      firstName: dbUser.firstName || 'User',
      lastName: dbUser.lastName || 'Member',
      role: effectiveRole,
      permissions,
    };

    req.user = userIdentity;
    next();
  } catch (error) {
    next(error instanceof UnauthorizedError ? error : new UnauthorizedError(error instanceof Error ? error.message : undefined));
  }
};

export const optionalAuthGuard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

    if (token === 'undefined' || token === 'null' || !token?.trim()) {
      token = null;
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as any;
        if (decoded && (decoded.id || decoded.email)) {
          let dbUser: any = null;
          if (decoded.id && decoded.id.length === 24) {
            dbUser = await (User as any).findById(decoded.id).select('-passwordHash').lean();
          }
          if (!dbUser && decoded.email) {
            const cleanEmail = String(decoded.email).toLowerCase().trim();
            dbUser = await (User as any).findOne({ email: cleanEmail }).select('-passwordHash').lean();
          }

          if (dbUser) {
            const rawRole = String(dbUser.role || '').toUpperCase();
            const effectiveRole: UserRole =
              rawRole === 'ADMIN' ? UserRole.TENANT_ADMIN :
              rawRole === 'SUPER_ADMIN' ? UserRole.SUPER_ADMIN :
              rawRole === 'TENANT_ADMIN' ? UserRole.TENANT_ADMIN :
              rawRole === 'STAFF' ? UserRole.STAFF :
              (rawRole as UserRole) || UserRole.HUB_MEMBER;

            const permissions = ROLE_PERMISSIONS[effectiveRole] || Object.values(Permission);

            req.user = {
              id: dbUser._id.toString(),
              tenantId: 'weventurehub',
              email: dbUser.email,
              firstName: dbUser.firstName || 'User',
              lastName: dbUser.lastName || 'Member',
              role: effectiveRole,
              permissions,
            };
          }
        }
      } catch (_) {
        // Ignore token errors in optional guard
      }
    }
  } catch (_) {
    // Ignore error for optional authentication
  }
  next();
};
