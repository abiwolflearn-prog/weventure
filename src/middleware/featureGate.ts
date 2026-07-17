import { Request, Response, NextFunction } from 'express';
import { subscriptionService } from '../services/SubscriptionService';
import { UnauthorizedError } from '../errors/AppError';

/**
 * Middleware factory to guard endpoint access using active subscription feature flags
 */
export const requireFeature = (featureKey: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenantId;
      if (!tenantId) {
        throw new UnauthorizedError('Tenant identification is required to check feature access');
      }

      const hasAccess = await subscriptionService.checkFeatureAccess(tenantId, featureKey);
      if (!hasAccess) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FEATURE_LOCKED',
            message: `This action requires the '${featureKey}' premium feature, which is not unlocked on your current subscription plan.`,
          }
        });
        return;
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};
