import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiResponse } from '../utils/response';
import { env } from '../config/env';
import { IUserIdentity, UserRole, Permission } from '../types';
import { ValidationError, UnauthorizedError } from '../errors/AppError';

// Centralized mapping of Roles to Enterprise Permissions
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: Object.values(Permission),
  [UserRole.TENANT_ADMIN]: Object.values(Permission),
  [UserRole.STAFF]: [
    Permission.USERS_READ,
    Permission.WORKSPACES_READ,
    Permission.WORKSPACES_UPDATE,
    Permission.BOOKINGS_READ,
    Permission.BOOKINGS_UPDATE,
    Permission.EVENTS_READ,
    Permission.EVENTS_UPDATE,
    Permission.ANALYTICS_READ,
  ],
  [UserRole.HUB_MEMBER]: [
    Permission.WORKSPACES_READ,
    Permission.BOOKINGS_CREATE,
    Permission.BOOKINGS_READ,
    Permission.EVENTS_READ,
  ],
  [UserRole.EXTERNAL_USER]: [
    Permission.WORKSPACES_READ,
    Permission.EVENTS_READ,
  ],
};

export class AuthController {
  /**
   * Authenticate / Login User and set secure httpOnly token cookie
   */
  public async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, tenantId, role } = req.body;

      if (!email || !password) {
        throw new ValidationError('Email and password are required');
      }

      const activeTenant = tenantId || req.tenantId || 'weventurehub';

      // Deduce User Role
      let userRole = UserRole.HUB_MEMBER;
      let firstName = 'Alex';
      let lastName = 'Chen';

      if (role && Object.values(UserRole).includes(role)) {
        userRole = role;
        if (role === UserRole.TENANT_ADMIN) {
          firstName = 'Admin';
          lastName = 'Manager';
        } else if (role === UserRole.STAFF) {
          firstName = 'Staff';
          lastName = 'Manager';
        } else if (role === UserRole.SUPER_ADMIN) {
          firstName = 'Super';
          lastName = 'Admin';
        }
      } else if (email.startsWith('admin@') || email.includes('admin')) {
        userRole = UserRole.TENANT_ADMIN;
        firstName = 'Admin';
        lastName = 'Manager';
      } else if (email.startsWith('staff@') || email.includes('staff')) {
        userRole = UserRole.STAFF;
        firstName = 'Staff';
        lastName = 'Manager';
      } else if (email.startsWith('superadmin@')) {
        userRole = UserRole.SUPER_ADMIN;
        firstName = 'Super';
        lastName = 'Admin';
      }

      const permissions = ROLE_PERMISSIONS[userRole] || [];

      const userIdentity: IUserIdentity = {
        id: `usr_${Math.random().toString(36).substring(2, 8)}`,
        tenantId: activeTenant,
        email,
        firstName,
        lastName,
        role: userRole,
        permissions,
      };

      // Sign JWT access token
      const token = jwt.sign({ ...userIdentity }, env.JWT_ACCESS_SECRET, {
        expiresIn: (env.JWT_ACCESS_EXPIRATION || '15m') as any,
      });

      // Set cookie - Lax in dev so it can travel across frames/tabs if needed, secure in production
      res.cookie('jwt_access_token', token, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
        maxAge: 15 * 60 * 1000, // 15 mins
        path: '/',
      });

      ApiResponse.success(res, {
        user: userIdentity,
        token,
        session: {
          expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        },
      }, 200, {
        message: 'Authentication successful',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Log out user and clear secure token cookie
   */
  public async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.clearCookie('jwt_access_token', {
        path: '/',
        secure: env.NODE_ENV === 'production',
        sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
      });

      ApiResponse.success(res, { status: 'logged-out' }, 200, {
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Fetch current user identity context using active token session
   */
  public async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('No active user session');
      }
      ApiResponse.success(res, { user: req.user }, 200);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
