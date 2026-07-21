import { IWorkspaceDocument } from '../models/Workspace';

export interface IPricingCalculationResult {
  baseAmount: number;
  totalAmount: number;
  appliedRules: { ruleName: string; modifierType: 'percentage' | 'fixed'; modifierValue: number; amountAdjusted: number }[];
  breakdown: string;
}

export class PricingService {
  /**
   * Calculates dynamic unit-based pricing for WeVentureHub plans (VAT, discounts, deposits).
   */
  public calculatePlanUnitsAndPrice(
    workspace: any,
    planName: string,
    startTime: Date,
    endTime: Date
  ): { units: number; pricePerUnit: number; totalAmount: number; breakdown: string } {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end.getTime() - start.getTime();
    
    const activePlan = workspace.billingPlans?.find(
      (p: any) => p.name.toLowerCase() === planName.toLowerCase() && p.isActive
    );

    if (!activePlan) {
      // Fallback to legacy hourly calculation
      const durationHours = Math.max(0.5, durationMs / (1000 * 60 * 60));
      const price = workspace.hourlyRate || 0;
      const total = durationHours * price;
      return {
        units: durationHours,
        pricePerUnit: price,
        totalAmount: Math.round(total * 100) / 100,
        breakdown: `Hourly Rate: ${durationHours.toFixed(1)} hours @ ${price} ETB/hr.`
      };
    }

    const pricePerUnit = activePlan.price;
    const currency = activePlan.currency || 'ETB';
    let units = 1;
    let breakdown = '';

    if (planName === 'Hourly') {
      units = Math.max(1, Math.ceil(durationMs / (1000 * 60 * 60)));
      breakdown = `Hourly Plan: ${units} hour(s) @ ${pricePerUnit} ${currency}/hr.`;
    } else if (planName === 'Daily') {
      units = Math.max(1, Math.ceil(durationMs / (1000 * 60 * 60 * 24)));
      breakdown = `Daily Plan: ${units} day(s) @ ${pricePerUnit} ${currency}/day.`;
    } else if (planName === 'Weekly') {
      units = Math.max(1, Math.ceil(durationMs / (1000 * 60 * 60 * 24 * 7)));
      breakdown = `Weekly Plan: ${units} week(s) @ ${pricePerUnit} ${currency}/week.`;
    } else if (planName === 'Monthly') {
      const monthsDiff = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      units = Math.max(1, monthsDiff === 0 ? 1 : monthsDiff);
      breakdown = `Monthly Plan: ${units} month(s) @ ${pricePerUnit} ${currency}/month.`;
    } else if (planName === 'Quarterly') {
      const monthsDiff = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      units = Math.max(1, Math.ceil(monthsDiff / 3));
      breakdown = `Quarterly Plan: ${units} quarter(s) @ ${pricePerUnit} ${currency}/quarter.`;
    } else if (planName === 'Yearly') {
      const yearsDiff = end.getFullYear() - start.getFullYear();
      units = Math.max(1, yearsDiff === 0 ? 1 : yearsDiff);
      breakdown = `Yearly Plan: ${units} year(s) @ ${pricePerUnit} ${currency}/year.`;
    }

    // Apply VAT and Discount
    const vatPercent = activePlan.vat || 0;
    const discountPercent = activePlan.discount || 0;
    const deposit = activePlan.deposit || 0;

    const baseTotal = units * pricePerUnit;
    const discountAmount = (baseTotal * discountPercent) / 100;
    const taxableAmount = baseTotal - discountAmount;
    const vatAmount = (taxableAmount * vatPercent) / 100;
    const finalAmount = taxableAmount + vatAmount + deposit;

    breakdown += ` Base: ${baseTotal} ${currency}.`;
    if (discountPercent > 0) breakdown += ` Discount (${discountPercent}%): -${discountAmount} ${currency}.`;
    if (vatPercent > 0) breakdown += ` VAT (${vatPercent}%): +${vatAmount} ${currency}.`;
    if (deposit > 0) breakdown += ` Security Deposit: +${deposit} ${currency}.`;

    return {
      units,
      pricePerUnit,
      totalAmount: Math.round(finalAmount * 100) / 100,
      breakdown
    };
  }

  /**
   * Calculates the booking price for a workspace, taking into account hourly, daily,
   * package pricing, and dynamic rules.
   */
  public calculatePrice(
    workspace: any,
    startTime: Date,
    endTime: Date
  ): IPricingCalculationResult {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end.getTime() - start.getTime();
    const durationHours = Math.max(0.5, durationMs / (1000 * 60 * 60));

    let baseAmount = 0;
    let breakdown = '';

    // 1. Try to apply Package pricing first (if matches duration or is a close fit)
    const packagePricing = workspace.packagePricing || [];
    const dailyRate = workspace.dailyRate;

    let appliedPackage = null;
    if (packagePricing.length > 0) {
      // Sort packages descending by hours to check the largest fitting package first
      const sortedPackages = [...packagePricing].sort((a, b) => b.hours - a.hours);
      for (const pkg of sortedPackages) {
        // If duration is greater or equal to package hours, we can suggest or apply it
        // Or if the package hours is exactly what was requested
        if (Math.abs(durationHours - pkg.hours) <= 0.1 || durationHours >= pkg.hours) {
          appliedPackage = pkg;
          break;
        }
      }
    }

    if (appliedPackage) {
      const multiplier = Math.floor(durationHours / appliedPackage.hours);
      const remainderHours = durationHours % appliedPackage.hours;
      const packageCost = multiplier * appliedPackage.price;
      const remainderCost = remainderHours * workspace.hourlyRate;
      
      baseAmount = packageCost + remainderCost;
      breakdown = `Package Applied: "${appliedPackage.name}" (${multiplier}x @ $${appliedPackage.price}). `;
      if (remainderHours > 0) {
        breakdown += `Remaining ${remainderHours.toFixed(1)} hrs calculated @ hourly rate of $${workspace.hourlyRate}/hr.`;
      }
    } else if (dailyRate && durationHours >= 8) {
      // 2. Try Daily Rate: If booking is 8+ hours and dailyRate is configured, apply it
      const days = Math.ceil(durationHours / 24);
      baseAmount = days * dailyRate;
      breakdown = `Daily Rate Applied: ${days} day(s) @ $${dailyRate}/day.`;
    } else {
      // 3. Fallback to standard Hourly pricing
      baseAmount = durationHours * workspace.hourlyRate;
      breakdown = `Hourly Rate Applied: ${durationHours.toFixed(1)} hrs @ $${workspace.hourlyRate}/hr.`;
    }

    // Round base rate
    baseAmount = Math.round(baseAmount * 100) / 100;

    // 4. Dynamic Pricing Rules
    const dynamicRules = workspace.dynamicPricingRules || [];
    const appliedRules: { ruleName: string; modifierType: 'percentage' | 'fixed'; modifierValue: number; amountAdjusted: number }[] = [];
    let totalAmount = baseAmount;

    for (const rule of dynamicRules) {
      let trigger = false;

      if (rule.type === 'weekend') {
        // Check if any booking day is a weekend (0 = Sunday, 6 = Saturday)
        const day = start.getDay();
        const endDay = end.getDay();
        if (day === 0 || day === 6 || endDay === 0 || endDay === 6) {
          trigger = true;
        }
      } else if (rule.type === 'peak_hour') {
        // Check if overlaps with peak hours
        const ruleStart = rule.startHour || 9;
        const ruleEnd = rule.endHour || 17;
        const startHour = start.getHours();
        const endHour = end.getHours();
        if (startHour < ruleEnd && endHour > ruleStart) {
          trigger = true;
        }
      } else if (rule.type === 'seasonal') {
        const ruleStartMonth = rule.startMonth || 1; // 1-indexed (Jan = 1)
        const ruleEndMonth = rule.endMonth || 12;
        const currentMonth = start.getMonth() + 1; // 0-indexed to 1-indexed
        if (ruleStartMonth <= ruleEndMonth) {
          if (currentMonth >= ruleStartMonth && currentMonth <= ruleEndMonth) {
            trigger = true;
          }
        } else {
          // Crosses new year
          if (currentMonth >= ruleStartMonth || currentMonth <= ruleEndMonth) {
            trigger = true;
          }
        }
      }

      if (trigger) {
        let adjustment = 0;
        if (rule.modifierType === 'percentage') {
          adjustment = Math.round((baseAmount * (rule.modifierValue / 100)) * 100) / 100;
        } else if (rule.modifierType === 'fixed') {
          adjustment = rule.modifierValue;
        }

        totalAmount += adjustment;
        appliedRules.push({
          ruleName: rule.ruleName,
          modifierType: rule.modifierType,
          modifierValue: rule.modifierValue,
          amountAdjusted: adjustment
        });
      }
    }

    totalAmount = Math.max(0, Math.round(totalAmount * 100) / 100);

    return {
      baseAmount,
      totalAmount,
      appliedRules,
      breakdown: breakdown + (appliedRules.length > 0 ? ` Dynamic adjustments applied: ${appliedRules.map(r => `${r.ruleName} (${r.amountAdjusted >= 0 ? '+' : ''}$${r.amountAdjusted})`).join(', ')}.` : '')
    };
  }
}

export const pricingService = new PricingService();
