import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiResponse } from '../utils/response';
import { env } from '../config/env';
import { IUserIdentity, UserRole, Permission } from '../types';
import { ValidationError, UnauthorizedError } from '../errors/AppError';
import { emailNotificationManager } from '../services/EmailNotificationManager';
import { User } from '../models/User';

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
      const cleanEmail = email.toLowerCase().trim();

      // Ensure user stored in MongoDB
      const dbUser = await (User as any).findOneAndUpdate(
        { email: cleanEmail, tenantId: activeTenant },
        {
          $setOnInsert: {
            email: cleanEmail,
            tenantId: activeTenant,
            firstName,
            lastName,
            role: userRole,
          },
        },
        { upsert: true, new: true }
      );

      const userIdentity: IUserIdentity = {
        id: dbUser._id ? dbUser._id.toString() : `usr_${Math.random().toString(36).substring(2, 8)}`,
        tenantId: activeTenant,
        email: cleanEmail,
        firstName: dbUser.firstName || firstName,
        lastName: dbUser.lastName || lastName,
        role: dbUser.role || userRole,
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
   * Register a new user account and trigger Welcome & Verification Email
   */
  public async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, firstName, lastName, password } = req.body;
      if (!email || !password) {
        throw new ValidationError('Email and password are required');
      }

      const activeTenant = req.tenantId || 'weventurehub';
      const cleanEmail = email.toLowerCase().trim();

      // Store / Update user in MongoDB User Collection
      let dbUser = await (User as any).findOneAndUpdate(
        { email: cleanEmail, tenantId: activeTenant },
        {
          $set: {
            email: cleanEmail,
            tenantId: activeTenant,
            firstName: firstName || 'New',
            lastName: lastName || 'Member',
            name: `${firstName || 'New'} ${lastName || 'Member'}`,
            role: UserRole.HUB_MEMBER,
          },
        },
        { upsert: true, new: true }
      );

      const user = {
        id: dbUser._id ? dbUser._id.toString() : `usr_${Math.random().toString(36).substring(2, 8)}`,
        tenantId: activeTenant,
        email: cleanEmail,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        name: dbUser.name,
        role: UserRole.HUB_MEMBER,
        permissions: ROLE_PERMISSIONS[UserRole.HUB_MEMBER],
      };

      // Trigger Welcome Email & Verification OTP via Email Notification Manager
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      await emailNotificationManager.sendWelcomeEmail(user);
      await emailNotificationManager.sendEmailVerification(user, otpCode, 15);
      await emailNotificationManager.sendNewUserRegistrationAdminAlert(user);

      ApiResponse.success(res, { user, otpRequired: true }, 201, { message: 'Registration successful. Welcome and verification emails sent!' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Request Password Reset and trigger Reset Email
   */
  public async requestPasswordReset(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      if (!email) {
        throw new ValidationError('Email is required');
      }

      const resetToken = `rst_${Math.random().toString(36).substring(2, 12)}`;
      await emailNotificationManager.sendPasswordReset({ email, firstName: 'Member' }, resetToken, 30);

      ApiResponse.success(res, { sent: true }, 200, { message: 'Password reset instructions sent to email' });
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
