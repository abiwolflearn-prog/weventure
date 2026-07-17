import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../errors/AppError';
import { UserRole, Permission } from '../types';

/**
 * Enforces that the authenticated user possesses at least one of the specified roles
 */
export const hasRoles = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new ForbiddenError('Authentication context is missing'));
      return;
    }

    const hasRole = allowedRoles.includes(req.user.role);
    if (!hasRole) {
      next(new ForbiddenError(`Required roles: [${allowedRoles.join(', ')}]. Active role: ${req.user.role}`));
      return;
    }

    next();
  };
};

/**
 * Enforces that the authenticated user possesses the specific permission
 */
export const hasPermission = (requiredPermission: Permission) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new ForbiddenError('Authentication context is missing'));
      return;
    }

    const hasPerm = req.user.permissions.includes(requiredPermission) || req.user.role === UserRole.SUPER_ADMIN;
    if (!hasPerm) {
      next(new ForbiddenError(`Missing required permission capability: '${requiredPermission}'`));
      return;
    }

    next();
  };
};
