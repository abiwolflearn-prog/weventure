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

    // 3. Fallback to query parameters
    if (!token && req.query.token) {
      token = req.query.token as string;
    }

    if (token === 'undefined' || token === 'null' || !token?.trim()) {
      token = null;
    }

    if (!token) {
      throw new UnauthorizedError('Access token is missing');
    }

    // Verify token
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, { ignoreExpiration: true }) as any;

    const cleanEmail = String(decoded.email || '').toLowerCase().trim();
    let rawRole = String(decoded.role || '').toUpperCase();

    // Look up current role in MongoDB if email is provided
    if (cleanEmail) {
      try {
        const dbUser = await (User as any).findOne({ email: cleanEmail }).select('role').lean();
        if (dbUser && dbUser.role) {
          rawRole = String(dbUser.role).toUpperCase();
        }
      } catch (_) {}
    }

    // Email pattern fallback inference if role is generic or missing
    if (rawRole === 'HUB_MEMBER' || rawRole === 'USER' || rawRole === 'EXTERNAL_USER' || !rawRole) {
      if (cleanEmail.startsWith('superadmin') || cleanEmail.includes('superadmin')) {
        rawRole = UserRole.SUPER_ADMIN;
      } else if (cleanEmail.startsWith('admin') || cleanEmail.includes('admin') || cleanEmail.includes('operator') || cleanEmail.includes('cfo')) {
        rawRole = UserRole.TENANT_ADMIN;
      } else if (cleanEmail.startsWith('staff') || cleanEmail.includes('staff') || cleanEmail.includes('manager')) {
        rawRole = UserRole.STAFF;
      }
    }

    // Normalize canonical role
    const effectiveRole: UserRole =
      rawRole === 'ADMIN' ? UserRole.TENANT_ADMIN :
      rawRole === 'SUPER_ADMIN' ? UserRole.SUPER_ADMIN :
      rawRole === 'TENANT_ADMIN' ? UserRole.TENANT_ADMIN :
      rawRole === 'STAFF' ? UserRole.STAFF :
      rawRole === 'MANAGER' ? UserRole.STAFF :
      (rawRole as UserRole) || UserRole.HUB_MEMBER;

    const permissions = ROLE_PERMISSIONS[effectiveRole] || decoded.permissions || Object.values(Permission);

    // Build the User Identity schema
    const userIdentity: IUserIdentity = {
      id: decoded.id || `usr_${Math.random().toString(36).substring(2, 8)}`,
      tenantId: 'weventurehub',
      email: cleanEmail,
      firstName: decoded.firstName || 'User',
      lastName: decoded.lastName || 'Member',
      role: effectiveRole,
      permissions,
    };

    // Set on request
    req.user = userIdentity;
    next();
  } catch (error) {
    next(new UnauthorizedError(error instanceof Error ? error.message : undefined));
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
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, { ignoreExpiration: true }) as any;
      if (decoded) {
        const cleanEmail = String(decoded.email || '').toLowerCase().trim();
        let rawRole = String(decoded.role || '').toUpperCase();

        if (cleanEmail) {
          try {
            const dbUser = await (User as any).findOne({ email: cleanEmail }).select('role').lean();
            if (dbUser && dbUser.role) {
              rawRole = String(dbUser.role).toUpperCase();
            }
          } catch (_) {}
        }

        if (rawRole === 'HUB_MEMBER' || rawRole === 'USER' || rawRole === 'EXTERNAL_USER' || !rawRole) {
          if (cleanEmail.startsWith('superadmin') || cleanEmail.includes('superadmin')) {
            rawRole = UserRole.SUPER_ADMIN;
          } else if (cleanEmail.startsWith('admin') || cleanEmail.includes('admin') || cleanEmail.includes('operator') || cleanEmail.includes('cfo')) {
            rawRole = UserRole.TENANT_ADMIN;
          } else if (cleanEmail.startsWith('staff') || cleanEmail.includes('staff') || cleanEmail.includes('manager')) {
            rawRole = UserRole.STAFF;
          }
        }

        const effectiveRole: UserRole =
          rawRole === 'ADMIN' ? UserRole.TENANT_ADMIN :
          rawRole === 'SUPER_ADMIN' ? UserRole.SUPER_ADMIN :
          rawRole === 'TENANT_ADMIN' ? UserRole.TENANT_ADMIN :
          rawRole === 'STAFF' ? UserRole.STAFF :
          rawRole === 'MANAGER' ? UserRole.STAFF :
          (rawRole as UserRole) || UserRole.HUB_MEMBER;

        const permissions = ROLE_PERMISSIONS[effectiveRole] || decoded.permissions || Object.values(Permission);

        req.user = {
          id: decoded.id,
          tenantId: 'weventurehub',
          email: cleanEmail,
          firstName: decoded.firstName || 'User',
          lastName: decoded.lastName || 'Member',
          role: effectiveRole,
          permissions,
        };
      }
    }
  } catch (_) {
    // Ignore invalid tokens for optional auth
  }
  next();
};

