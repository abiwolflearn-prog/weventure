import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../errors/AppError';
import { UserRole, Permission } from '../types';

/**
 * Enforces that the authenticated user possesses at least one of the specified roles.
 * Super Admins automatically bypass role restrictions.
 * Tenant Admins & Admins satisfy STAFF & TENANT_ADMIN requirements.
 */
export const hasRoles = (allowedRoles: (UserRole | string)[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new ForbiddenError('Authentication context is missing'));
      return;
    }

    const rawRole = String(req.user.role || '').toUpperCase();

    // Canonical role mapping
    const activeRole =
      rawRole === 'ADMIN' ? UserRole.TENANT_ADMIN :
      rawRole === 'USER' ? UserRole.HUB_MEMBER :
      rawRole as UserRole;

    // Super Admin has full governance access
    if (activeRole === UserRole.SUPER_ADMIN || rawRole === 'SUPER_ADMIN') {
      next();
      return;
    }

    const hasRole = allowedRoles.some((allowed) => {
      const allowedStr = String(allowed).toUpperCase();
      if (allowedStr === activeRole || allowedStr === rawRole) return true;
      if (allowedStr === 'TENANT_ADMIN' && (activeRole === UserRole.TENANT_ADMIN || rawRole === 'ADMIN')) return true;
      if (allowedStr === 'ADMIN' && (activeRole === UserRole.TENANT_ADMIN || rawRole === 'ADMIN')) return true;
      if (allowedStr === 'STAFF' && (activeRole === UserRole.TENANT_ADMIN || rawRole === 'ADMIN' || activeRole === UserRole.STAFF)) return true;
      return false;
    });

    if (!hasRole) {
      next(new ForbiddenError(`Required roles: [${allowedRoles.join(', ')}]. Active role: ${req.user.role}`));
      return;
    }

    next();
  };
};

/**
 * Enforces that the authenticated user possesses the specific permission.
 * Administrative roles automatically hold all system permissions.
 */
export const hasPermission = (requiredPermission: Permission) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new ForbiddenError('Authentication context is missing'));
      return;
    }

    const rawRole = String(req.user.role || '').toUpperCase();
    const isSuperOrTenantAdmin =
      rawRole === 'SUPER_ADMIN' ||
      rawRole === UserRole.SUPER_ADMIN ||
      rawRole === 'TENANT_ADMIN' ||
      rawRole === UserRole.TENANT_ADMIN ||
      rawRole === 'ADMIN';

    const userPerms = req.user.permissions || [];
    const hasPerm = isSuperOrTenantAdmin || userPerms.includes(requiredPermission);

    if (!hasPerm) {
      next(new ForbiddenError(`Missing required permission capability: '${requiredPermission}'`));
      return;
    }

    next();
  };
};

