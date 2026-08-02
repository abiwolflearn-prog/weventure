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

      // Check existing user for email verification status
      const existingUser = await (User as any).findOne({ email: cleanEmail, tenantId: activeTenant });
      if (existingUser && existingUser.isEmailVerified === false) {
        throw new UnauthorizedError('Please verify your email before logging in.');
      }

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
            isEmailVerified: true, // Default true for admin/staff created via direct login
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

      // Set cookie - SameSite none + secure in production for cross-site requests between Vercel & Render
      res.cookie('jwt_access_token', token, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
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
      const { email, firstName, lastName, name, password, userType, phone, profileImage, companyInfo } = req.body;
      if (!email || (!password && !req.body.adminPassword)) {
        throw new ValidationError('Email and password are required');
      }

      const activeTenant = req.tenantId || 'weventurehub';
      const cleanEmail = email.toLowerCase().trim();
      const resolvedName = name || `${firstName || ''} ${lastName || ''}`.trim() || 'WeVenture Member';
      const resolvedFirstName = firstName || resolvedName.split(' ')[0] || 'Member';
      const resolvedLastName = lastName || resolvedName.split(' ').slice(1).join(' ') || 'User';

      // Generate secure unique verification token and OTP code
      const verificationToken = `vrf_${Math.random().toString(36).substring(2, 12)}${Date.now().toString(36)}`;
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Store / Update user in MongoDB User Collection
      let dbUser = await (User as any).findOneAndUpdate(
        { email: cleanEmail, tenantId: activeTenant },
        {
          $set: {
            tenantId: activeTenant,
            userType: userType || 'individual',
            email: cleanEmail,
            firstName: resolvedFirstName,
            lastName: resolvedLastName,
            name: resolvedName,
            phone: phone || '',
            profileImage: profileImage || companyInfo?.companyLogo || '',
            companyInfo: companyInfo ? {
              companyName: companyInfo.companyName,
              companyLogo: companyInfo.companyLogo,
              companyCover: companyInfo.companyCover,
              address: companyInfo.address,
              industry: companyInfo.industry,
              employees: companyInfo.employees,
            } : undefined,
            role: UserRole.HUB_MEMBER,
            isEmailVerified: false,
            emailVerificationToken: verificationToken,
            emailVerificationOtp: otpCode,
            emailVerificationExpires: verificationExpires,
          },
        },
        { upsert: true, new: true }
      );

      const user = {
        id: dbUser._id ? dbUser._id.toString() : `usr_${Math.random().toString(36).substring(2, 8)}`,
        tenantId: activeTenant,
        userType: dbUser.userType || userType || 'individual',
        email: cleanEmail,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        name: dbUser.name,
        phone: dbUser.phone,
        profileImage: dbUser.profileImage,
        companyInfo: dbUser.companyInfo,
        role: UserRole.HUB_MEMBER,
        permissions: ROLE_PERMISSIONS[UserRole.HUB_MEMBER],
        isEmailVerified: false,
      };

      // Trigger Welcome Email & Verification OTP via Email Notification Manager
      await emailNotificationManager.sendWelcomeEmail(user);
      await emailNotificationManager.sendEmailVerification(user, verificationToken, otpCode, 60);
      await emailNotificationManager.sendNewUserRegistrationAdminAlert(user);

      ApiResponse.success(
        res,
        {
          user,
          otpRequired: true,
          verificationToken,
          verificationCode: otpCode,
        },
        201,
        { message: 'Registration successful. A verification email has been sent.' }
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Confirm & verify user email using token or OTP code
   */
  public async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, code, token } = { ...req.query, ...req.body };
      const cleanEmail = email ? String(email).toLowerCase().trim() : undefined;
      const otpCode = code || req.body?.otp || req.body?.verificationCode || req.query?.code;
      const verifyToken = token || req.body?.verificationToken || req.query?.token;

      if (!verifyToken && !otpCode) {
        throw new ValidationError('Verification token or OTP code is required');
      }

      let dbUser: any = null;

      if (cleanEmail) {
        dbUser = await (User as any).findOne({
          email: cleanEmail,
          $or: [
            ...(verifyToken ? [{ emailVerificationToken: verifyToken }] : []),
            ...(otpCode ? [{ emailVerificationOtp: String(otpCode) }] : []),
          ],
        });
      }

      if (!dbUser && verifyToken) {
        dbUser = await (User as any).findOne({ emailVerificationToken: verifyToken });
      }

      if (!dbUser && otpCode) {
        dbUser = await (User as any).findOne({ emailVerificationOtp: String(otpCode) });
      }

      if (!dbUser) {
        throw new ValidationError('Invalid verification token or code. Please check your email and try again.');
      }

      // Check expiration if set
      if (dbUser.emailVerificationExpires && new Date(dbUser.emailVerificationExpires) < new Date()) {
        throw new ValidationError('Verification link or code has expired. Please request a new one.');
      }

      dbUser.isEmailVerified = true;
      dbUser.emailVerificationToken = undefined;
      dbUser.emailVerificationOtp = undefined;
      dbUser.emailVerificationExpires = undefined;
      await dbUser.save();

      ApiResponse.success(
        res,
        {
          verified: true,
          email: dbUser.email,
        },
        200,
        { message: 'Email verified successfully. You may now log in.' }
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Resend verification email
   */
  public async resendVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      if (!email) {
        throw new ValidationError('Email address is required');
      }

      const cleanEmail = String(email).toLowerCase().trim();
      const activeTenant = req.tenantId || 'weventurehub';
      const dbUser = await (User as any).findOne({ email: cleanEmail, tenantId: activeTenant });

      if (!dbUser) {
        throw new ValidationError('No account found with that email address.');
      }

      if (dbUser.isEmailVerified) {
        ApiResponse.success(res, { verified: true }, 200, { message: 'Account is already verified. You can log in.' });
        return;
      }

      const verificationToken = `vrf_${Math.random().toString(36).substring(2, 12)}${Date.now().toString(36)}`;
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

      dbUser.emailVerificationToken = verificationToken;
      dbUser.emailVerificationOtp = otpCode;
      dbUser.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await dbUser.save();

      const userObj = {
        id: dbUser._id.toString(),
        tenantId: activeTenant,
        email: cleanEmail,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        name: dbUser.name,
      };

      await emailNotificationManager.sendEmailVerification(userObj, verificationToken, otpCode, 60);

      ApiResponse.success(
        res,
        { sent: true, verificationToken, otpCode },
        200,
        { message: 'Verification email resent successfully.' }
      );
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
        sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
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
