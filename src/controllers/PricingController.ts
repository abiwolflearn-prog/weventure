import { Request, Response, NextFunction } from 'express';
import { PricingRule } from '../models/PricingRule';
import { pricingService } from '../services/PricingService';
import { ApiResponse } from '../utils/response';
import { ValidationError, NotFoundError } from '../errors/AppError';

export class PricingController {
  // Get all pricing rules (optionally filtered by resourceName or isActive)
  public async listRules(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      const { resourceName, isActive } = req.query;

      const filter: any = { tenantId };
      if (resourceName) {
        filter.resourceName = resourceName as string;
      }
      if (isActive !== undefined) {
        filter.isActive = isActive === 'true';
      }

      const rules = await PricingRule.find(filter).sort({ resourceName: 1, minimumDuration: 1 }).exec();
      ApiResponse.success(res, rules, 200);
    } catch (error) {
      next(error);
    }
  }

  // Get a single pricing rule
  public async getRuleById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      const { id } = req.params;

      const rule = await PricingRule.findOne({ _id: id, tenantId }).exec();
      if (!rule) {
        throw new NotFoundError('Pricing rule not found');
      }

      ApiResponse.success(res, rule, 200);
    } catch (error) {
      next(error);
    }
  }

  // Create a new pricing rule
  public async createRule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      const {
        resourceId,
        resourceType,
        resourceName,
        pricingType,
        billingCycle,
        minimumDuration,
        maximumDuration,
        basePrice,
        vatPercentage,
        totalPrice,
        currency,
        effectiveFrom,
        effectiveTo,
        isActive,
      } = req.body;

      if (!resourceType || !resourceName || !billingCycle || basePrice === undefined || totalPrice === undefined) {
        throw new ValidationError('Missing required fields for pricing rule');
      }

      const rule = await PricingRule.create({
        tenantId,
        resourceId,
        resourceType,
        resourceName,
        pricingType: pricingType || 'Duration-Based',
        billingCycle,
        minimumDuration: minimumDuration !== undefined ? Number(minimumDuration) : 0,
        maximumDuration: maximumDuration !== undefined ? Number(maximumDuration) : 999999,
        basePrice: Number(basePrice),
        vatPercentage: vatPercentage !== undefined ? Number(vatPercentage) : 15,
        totalPrice: Number(totalPrice),
        currency: currency || 'USD',
        effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : undefined,
        effectiveTo: effectiveTo ? new Date(effectiveTo) : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        createdBy: req.user ? (req.user as any).email : 'system',
        updatedBy: req.user ? (req.user as any).email : 'system',
      });

      ApiResponse.success(res, rule, 201, {
        message: 'Pricing rule created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // Update a pricing rule
  public async updateRule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      const { id } = req.params;

      const rule = await PricingRule.findOne({ _id: id, tenantId }).exec();
      if (!rule) {
        throw new NotFoundError('Pricing rule not found');
      }

      const {
        resourceId,
        resourceType,
        resourceName,
        pricingType,
        billingCycle,
        minimumDuration,
        maximumDuration,
        basePrice,
        vatPercentage,
        totalPrice,
        currency,
        effectiveFrom,
        effectiveTo,
        isActive,
      } = req.body;

      if (resourceId !== undefined) rule.resourceId = resourceId;
      if (resourceType !== undefined) rule.resourceType = resourceType;
      if (resourceName !== undefined) rule.resourceName = resourceName;
      if (pricingType !== undefined) rule.pricingType = pricingType;
      if (billingCycle !== undefined) rule.billingCycle = billingCycle;
      if (minimumDuration !== undefined) rule.minimumDuration = Number(minimumDuration);
      if (maximumDuration !== undefined) rule.maximumDuration = Number(maximumDuration);
      if (basePrice !== undefined) rule.basePrice = Number(basePrice);
      if (vatPercentage !== undefined) rule.vatPercentage = Number(vatPercentage);
      if (totalPrice !== undefined) rule.totalPrice = Number(totalPrice);
      if (currency !== undefined) rule.currency = currency;
      if (effectiveFrom !== undefined) rule.effectiveFrom = effectiveFrom ? new Date(effectiveFrom) : undefined;
      if (effectiveTo !== undefined) rule.effectiveTo = effectiveTo ? new Date(effectiveTo) : undefined;
      if (isActive !== undefined) rule.isActive = Boolean(isActive);

      rule.updatedBy = req.user ? (req.user as any).email : 'system';

      await rule.save();

      ApiResponse.success(res, rule, 200, {
        message: 'Pricing rule updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete a pricing rule
  public async deleteRule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      const { id } = req.params;

      const deleted = await PricingRule.findOneAndDelete({ _id: id, tenantId }).exec();
      if (!deleted) {
        throw new NotFoundError('Pricing rule not found');
      }

      ApiResponse.success(res, { id }, 200, {
        message: 'Pricing rule deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // Dynamic automatic price calculation engine for user/admin booking preview
  public async calculatePrice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      const { spaceId, startTime, endTime, durationType, durationQuantity } = req.body;

      if (!spaceId || !startTime || !endTime) {
        throw new ValidationError('spaceId, startTime, and endTime are required');
      }

      const pricing = await pricingService.calculateAutomaticPrice(
        spaceId,
        startTime,
        endTime,
        tenantId,
        durationType,
        durationQuantity
      );
      ApiResponse.success(res, pricing, 200);
    } catch (error) {
      next(error);
    }
  }
}

export const pricingController = new PricingController();
