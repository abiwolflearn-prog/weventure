import { PricingRule, IPricingRuleDocument } from '../models/PricingRule';
import { Workspace } from '../models/Workspace';

export interface IPricingCalculationResult {
  baseAmount: number;
  totalAmount: number;
  appliedRules: { ruleName: string; modifierType: 'percentage' | 'fixed'; modifierValue: number; amountAdjusted: number }[];
  breakdown: string;
}

export class PricingService {
  /**
   * CENTRALIZED PRICING CALCULATION ENGINE
   * All systems must use this service:
   * - Public booking
   * - User dashboard booking
   * - Admin booking
   * - Invoice generation
   * - Payment page
   * - Reservation summary
   */
  public async calculateAutomaticPrice(
    spaceIdOrName: string,
    startTime: Date | string,
    endTime: Date | string,
    tenantId: string = 'weventurehub',
    durationType?: string,
    durationQuantity?: number
  ): Promise<{
    basePrice: number;
    vatPercentage: number;
    vatAmount: number;
    totalPrice: number;
    billingCycle: string;
    billingRuleApplied: string;
  }> {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end.getTime() - start.getTime();
    const durationHours = Math.max(0.5, durationMs / (1000 * 60 * 60));

    // Try to find if spaceIdOrName is a workspace ID
    let resourceName = spaceIdOrName;
    let workspace = null;
    
    try {
      if (spaceIdOrName.match(/^[0-9a-fA-F]{24}$/)) {
        workspace = await Workspace.findById(spaceIdOrName).exec();
        if (workspace) {
          resourceName = workspace.name;
        }
      }
    } catch (e) {
      // Ignored, fallback to name matching
    }

    // If workspace has billingPlans configured, use them directly as requested!
    if (workspace && workspace.billingPlans && workspace.billingPlans.length > 0) {
      // Find matching billing cycle plan
      let matchedPlan = null;
      if (durationType) {
        matchedPlan = workspace.billingPlans.find((p: any) => p.name === durationType && p.isActive !== false);
      }
      
      // If we don't have a durationType or didn't find a match, find the first active plan
      if (!matchedPlan) {
        matchedPlan = workspace.billingPlans.find((p: any) => p.isActive !== false);
      }

      if (matchedPlan) {
        const qty = Math.max(1, durationQuantity || 1);
        const basePrice = Math.round(matchedPlan.price * qty * 100) / 100;
        const vatPercentage = matchedPlan.vat !== undefined ? matchedPlan.vat : 15;
        const vatAmount = Math.round(basePrice * (vatPercentage / 100) * 100) / 100;
        const totalPrice = Math.round((basePrice + vatAmount) * 100) / 100;

        return {
          basePrice,
          vatPercentage,
          vatAmount,
          totalPrice,
          billingCycle: matchedPlan.name,
          billingRuleApplied: `Workspace Configured Option - ${matchedPlan.name}`,
        };
      }
    }

    // Determine Normalized Resource Name
    let normalizedName = resourceName;
    let isMembership = false;

    if (/event/i.test(resourceName)) {
      normalizedName = 'Event Space';
    } else if (/training/i.test(resourceName)) {
      normalizedName = 'Training Room';
    } else if (/meeting/i.test(resourceName)) {
      normalizedName = 'Meeting Room';
    } else if (/dedicated/i.test(resourceName)) {
      normalizedName = 'Dedicated Desk';
      isMembership = true;
    } else if (/small.*private/i.test(resourceName)) {
      normalizedName = 'Small Private Office';
      isMembership = true;
    } else if (/large.*private/i.test(resourceName)) {
      normalizedName = 'Large Private Office';
      isMembership = true;
    } else if (workspace) {
      // Fallback based on workspace type
      const type = workspace.type || workspace.workspaceType;
      if (type === 'EVENT_VENUE') normalizedName = 'Event Space';
      else if (type === 'TRAINING_ROOM') normalizedName = 'Training Room';
      else if (type === 'MEETING_ROOM' || type === 'CONFERENCE_ROOM') normalizedName = 'Meeting Room';
      else if (type === 'DEDICATED_DESK') {
        normalizedName = 'Dedicated Desk';
        isMembership = true;
      } else if (type === 'PRIVATE_OFFICE') {
        if (workspace.capacity <= 5) {
          normalizedName = 'Small Private Office';
        } else {
          normalizedName = 'Large Private Office';
        }
        isMembership = true;
      }
    }

    // Query active database rules for this resource
    const rules = await PricingRule.find({
      tenantId,
      resourceName: normalizedName,
      isActive: true,
    }).exec();

    if (!rules || rules.length === 0) {
      // Fallback in case no rules found: use default hardcoded calculations
      return this.fallbackCalculate(normalizedName, durationHours);
    }

    if (isMembership) {
      // Membership billing cycle is usually Monthly
      const rule = rules.find(r => r.billingCycle === 'Monthly') || rules[0];
      const months = Math.max(1, Math.ceil(durationHours / (24 * 30)));
      const basePrice = Math.round(rule.basePrice * months * 100) / 100;
      const vatPercentage = rule.vatPercentage;
      const vatAmount = Math.round(basePrice * (vatPercentage / 100) * 100) / 100;
      const totalPrice = Math.round((basePrice + vatAmount) * 100) / 100;

      return {
        basePrice,
        vatPercentage,
        vatAmount,
        totalPrice,
        billingCycle: rule.billingCycle,
        billingRuleApplied: `${normalizedName} - Monthly Flat`,
      };
    }

    // For Hourly/Duration-Based Spaces
    // Find the rule that fits the duration range
    let matchedRule = rules.find(
      rule => durationHours >= rule.minimumDuration && durationHours <= rule.maximumDuration
    );

    // If no rule matched the specific range, find the default Hourly rule
    if (!matchedRule) {
      matchedRule = rules.find(r => r.billingCycle === 'Hourly') || rules[0];
    }

    const vatPercentage = matchedRule.vatPercentage;
    let basePrice = 0;
    let billingCycle = matchedRule.billingCycle;

    if (matchedRule.billingCycle === 'Hourly') {
      basePrice = Math.round(matchedRule.basePrice * durationHours * 100) / 100;
    } else {
      // Flat rate for specific intervals (Half Day, Full Day, Up to 2 Hours, etc.)
      basePrice = matchedRule.basePrice;
    }

    const vatAmount = Math.round(basePrice * (vatPercentage / 100) * 100) / 100;
    const totalPrice = Math.round((basePrice + vatAmount) * 100) / 100;

    return {
      basePrice,
      vatPercentage,
      vatAmount,
      totalPrice,
      billingCycle,
      billingRuleApplied: `${normalizedName} - ${matchedRule.billingCycle}`,
    };
  }

  private fallbackCalculate(resourceName: string, durationHours: number) {
    let basePrice = 0;
    let vatPercentage = 15;
    let billingCycle = 'Hourly';
    let billingRuleApplied = `${resourceName} - Default`;

    if (resourceName === 'Event Space') {
      if (durationHours <= 2) {
        basePrice = 200;
        billingCycle = 'Up to 2 Hours';
      } else if (durationHours <= 6) {
        basePrice = 400;
        billingCycle = 'Half Day';
      } else {
        basePrice = 600;
        billingCycle = 'Full Day';
      }
    } else if (resourceName === 'Training Room') {
      if (durationHours <= 3) {
        basePrice = 30 * durationHours;
        billingCycle = 'Hourly';
      } else if (durationHours <= 6) {
        basePrice = 130;
        billingCycle = 'Half Day';
      } else {
        basePrice = 250;
        billingCycle = 'Full Day';
      }
    } else if (resourceName === 'Meeting Room') {
      if (durationHours <= 3) {
        basePrice = 25 * durationHours;
        billingCycle = 'Hourly';
      } else if (durationHours <= 6) {
        basePrice = 100;
        billingCycle = 'Half Day';
      } else {
        basePrice = 190;
        billingCycle = 'Full Day';
      }
    } else if (resourceName === 'Dedicated Desk') {
      const months = Math.max(1, Math.ceil(durationHours / (24 * 30)));
      basePrice = 73.91 * months;
      billingCycle = 'Monthly';
    } else if (resourceName === 'Small Private Office') {
      const months = Math.max(1, Math.ceil(durationHours / (24 * 30)));
      basePrice = 652.17 * months;
      billingCycle = 'Monthly';
    } else if (resourceName === 'Large Private Office') {
      const months = Math.max(1, Math.ceil(durationHours / (24 * 30)));
      basePrice = 826.09 * months;
      billingCycle = 'Monthly';
    } else {
      basePrice = 30 * durationHours;
    }

    basePrice = Math.round(basePrice * 100) / 100;
    const vatAmount = Math.round(basePrice * (vatPercentage / 100) * 100) / 100;
    const totalPrice = Math.round((basePrice + vatAmount) * 100) / 100;

    return {
      basePrice,
      vatPercentage,
      vatAmount,
      totalPrice,
      billingCycle,
      billingRuleApplied,
    };
  }

  // Preserve signatures of old methods so that we do not break any legacy imports that might expect them:
  public calculatePlanUnitsAndPrice(
    workspace: any,
    planName: string,
    startTime: Date,
    endTime: Date
  ): { units: number; pricePerUnit: number; totalAmount: number; breakdown: string } {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end.getTime() - start.getTime();
    const durationHours = Math.max(0.5, durationMs / (1000 * 60 * 60));

    // Map plan to database rules if possible
    let basePrice = workspace.hourlyRate || 30;
    if (planName === 'Hourly') basePrice = workspace.hourlyRate || 30;
    else if (planName === 'Daily') basePrice = workspace.dailyRate || 130;
    else if (planName === 'Monthly') basePrice = workspace.monthlyPrice || 750;

    const units = Math.ceil(durationHours);
    const totalAmount = basePrice * units;

    return {
      units,
      pricePerUnit: basePrice,
      totalAmount,
      breakdown: `${planName} calculation: ${units} units @ ${basePrice} USD/unit.`,
    };
  }

  public calculatePrice(
    workspace: any,
    startTime: Date,
    endTime: Date
  ): IPricingCalculationResult {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end.getTime() - start.getTime();
    const durationHours = Math.max(0.5, durationMs / (1000 * 60 * 60));
    const baseAmount = Math.round(durationHours * (workspace.hourlyRate || 30) * 100) / 100;

    return {
      baseAmount,
      totalAmount: baseAmount,
      appliedRules: [],
      breakdown: `Hourly rate applied: ${durationHours.toFixed(1)} hrs @ $${workspace.hourlyRate || 30}/hr.`,
    };
  }
}

export const pricingService = new PricingService();
