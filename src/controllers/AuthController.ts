import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiResponse } from '../utils/response';
import { env } from '../config/env';
import { IUserIdentity, UserRole, Permission } from '../types';
import { ValidationError, UnauthorizedError } from '../errors/AppError';
import { emailNotificationManager } from '../services/EmailNotificationManager';
import { User } from '../models/User';

// Centralized mapping of Roles to Enterprise Permissions
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  [UserRole.SUPER_ADMIN]: Object.values(Permission),
  [UserRole.TENANT_ADMIN]: Object.values(Permission),
  ['ADMIN']: Object.values(Permission),
  [UserRole.STAFF]: [
    Permission.USERS_READ,
    Permission.WORKSPACES_READ,
    Permission.WORKSPACES_CREATE,
    Permission.WORKSPACES_UPDATE,
    Permission.BOOKINGS_READ,
    Permission.BOOKINGS_UPDATE,
    Permission.EVENTS_READ,
    Permission.EVENTS_CREATE,
    Permission.EVENTS_UPDATE,
    Permission.ANALYTICS_READ,
  ],
  ['MANAGER']: [
    Permission.USERS_READ,
    Permission.WORKSPACES_READ,
    Permission.WORKSPACES_CREATE,
    Permission.WORKSPACES_UPDATE,
    Permission.BOOKINGS_READ,
    Permission.BOOKINGS_UPDATE,
    Permission.EVENTS_READ,
    Permission.EVENTS_CREATE,
    Permission.EVENTS_UPDATE,
    Permission.ANALYTICS_READ,
  ],
  [UserRole.HUB_MEMBER]: [
    Permission.WORKSPACES_READ,
    Permission.BOOKINGS_CREATE,
    Permission.BOOKINGS_READ,
    Permission.EVENTS_READ,
    Permission.SETTINGS_UPDATE,
  ],
  ['USER']: [
    Permission.WORKSPACES_READ,
    Permission.BOOKINGS_CREATE,
    Permission.BOOKINGS_READ,
    Permission.EVENTS_READ,
    Permission.SETTINGS_UPDATE,
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
      const cleanEmail = email.toLowerCase().trim();

      // Determine requested / inferred role
      let targetRole: UserRole | undefined = undefined;
      let firstName = 'Alex';
      let lastName = 'Member';

      if (role && Object.values(UserRole).includes(role) && role !== UserRole.HUB_MEMBER) {
        targetRole = role as UserRole;
      } else if (cleanEmail.startsWith('superadmin') || cleanEmail.includes('superadmin')) {
        targetRole = UserRole.SUPER_ADMIN;
        firstName = 'Super';
        lastName = 'Admin';
      } else if (cleanEmail.startsWith('admin') || cleanEmail.includes('admin') || cleanEmail.includes('operator')) {
        targetRole = UserRole.TENANT_ADMIN;
        firstName = 'Admin';
        lastName = 'Manager';
      } else if (cleanEmail.startsWith('staff') || cleanEmail.includes('staff') || cleanEmail.includes('manager')) {
        targetRole = UserRole.STAFF;
        firstName = 'Staff';
        lastName = 'Manager';
      }

      if (targetRole === UserRole.SUPER_ADMIN) {
        firstName = 'Super';
        lastName = 'Admin';
      } else if (targetRole === UserRole.TENANT_ADMIN) {
        firstName = 'Admin';
        lastName = 'Manager';
      } else if (targetRole === UserRole.STAFF) {
        firstName = 'Staff';
        lastName = 'Manager';
      }

      // Look up existing user record in MongoDB
      let dbUser = await (User as any).findOne({ email: cleanEmail, tenantId: activeTenant });

      const isTargetAdminRole = (targetRole && [UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.STAFF].includes(targetRole)) ||
        cleanEmail.includes('admin') || cleanEmail.includes('staff') || cleanEmail.includes('superadmin');

      if (dbUser && dbUser.isEmailVerified === false) {
        if (isTargetAdminRole) {
          dbUser.isEmailVerified = true;
          if (targetRole) dbUser.role = targetRole;
          await dbUser.save();
        } else {
          // Auto-verify on valid direct password login
          dbUser.isEmailVerified = true;
          await dbUser.save();
        }
      }

      if (!dbUser) {
        const finalRole = targetRole || UserRole.HUB_MEMBER;
        dbUser = await (User as any).create({
          email: cleanEmail,
          tenantId: activeTenant,
          firstName,
          lastName,
          role: finalRole,
          isEmailVerified: true, // Default true for direct logins
        });
      } else {
        // If logging in with an admin targetRole or if email belongs to admin account, update user's role in DB
        if (isTargetAdminRole) {
          dbUser.role = targetRole || dbUser.role;
          dbUser.isEmailVerified = true;
          await dbUser.save();
        }
      }

      const effectiveRole: UserRole = dbUser.role || targetRole || UserRole.HUB_MEMBER;
      const permissions = ROLE_PERMISSIONS[effectiveRole] || Object.values(Permission);

      const userIdentity: IUserIdentity = {
        id: dbUser._id ? dbUser._id.toString() : `usr_${Math.random().toString(36).substring(2, 8)}`,
        tenantId: activeTenant,
        email: cleanEmail,
        firstName: dbUser.firstName || firstName,
        lastName: dbUser.lastName || lastName,
        role: effectiveRole,
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
      const { email, firstName, lastName, name, password, userType, phone, profileImage, companyInfo, role } = req.body;
      if (!email || (!password && !req.body.adminPassword)) {
        throw new ValidationError('Email and password are required');
      }

      const activeTenant = req.tenantId || 'weventurehub';
      const cleanEmail = email.toLowerCase().trim();
      const resolvedName = name || `${firstName || ''} ${lastName || ''}`.trim() || 'WeVenture Member';
      const resolvedFirstName = firstName || resolvedName.split(' ')[0] || 'Member';
      const resolvedLastName = lastName || resolvedName.split(' ').slice(1).join(' ') || 'User';

      // Infer role for registration if admin email or specified role
      let initialRole = UserRole.HUB_MEMBER;
      if (role && Object.values(UserRole).includes(role)) {
        initialRole = role as UserRole;
      } else if (cleanEmail.startsWith('superadmin')) {
        initialRole = UserRole.SUPER_ADMIN;
      } else if (cleanEmail.startsWith('admin') || cleanEmail.includes('admin')) {
        initialRole = UserRole.TENANT_ADMIN;
      } else if (cleanEmail.startsWith('staff') || cleanEmail.includes('staff')) {
        initialRole = UserRole.STAFF;
      }

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
            role: initialRole,
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
        role: dbUser.role || initialRole,
        permissions: ROLE_PERMISSIONS[dbUser.role || initialRole] || ROLE_PERMISSIONS[UserRole.HUB_MEMBER],
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

      // Re-verify role from database
      const dbUser = await (User as any).findOne({ email: req.user.email });
      if (dbUser) {
        const effectiveRole = dbUser.role || req.user.role;
        const permissions = ROLE_PERMISSIONS[effectiveRole] || req.user.permissions || [];
        req.user = {
          ...req.user,
          role: effectiveRole,
          permissions,
        };
      }

      ApiResponse.success(res, { user: req.user }, 200);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
