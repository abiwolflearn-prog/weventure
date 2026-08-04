export type DurationType = string;

/**
 * Formats duration type and quantity into a readable string format.
 * Examples:
 * - formatBookingDuration('Hourly', 3) => "3 Hours"
 * - formatBookingDuration('Daily', 3) => "3 Days"
 * - formatBookingDuration('Weekly', 4) => "4 Weeks"
 * - formatBookingDuration('Monthly', 18) => "18 Months"
 * - formatBookingDuration('Yearly', 2) => "2 Years"
 * - formatBookingDuration('Daily', 1) => "1 Day"
 */
export function formatBookingDuration(durationType?: string, quantity?: number | string): string {
  if (!durationType) return '';
  const qty = Math.max(1, parseInt(String(quantity), 10) || 1);
  const typeStr = durationType.toLowerCase();

  let unit = '';
  if (typeStr.includes('hour') || typeStr.includes('hourly')) {
    unit = qty === 1 ? 'Hour' : 'Hours';
  } else if (typeStr.includes('day') || typeStr.includes('daily')) {
    unit = qty === 1 ? 'Day' : 'Days';
  } else if (typeStr.includes('week') || typeStr.includes('weekly')) {
    unit = qty === 1 ? 'Week' : 'Weeks';
  } else if (typeStr.includes('month') || typeStr.includes('monthly')) {
    unit = qty === 1 ? 'Month' : 'Months';
  } else if (typeStr.includes('year') || typeStr.includes('yearly')) {
    unit = qty === 1 ? 'Year' : 'Years';
  } else {
    unit = durationType;
  }

  return `${qty} ${unit}`;
}

/**
 * Gets the applicable unit price for a given workspace and duration type.
 */
export function getWorkspaceUnitPrice(workspace: any, durationType: DurationType = 'Daily'): number {
  if (!workspace) return 0;
  
  // 1. Check if workspace has billingPlans configured
  if (workspace.billingPlans && Array.isArray(workspace.billingPlans)) {
    const matchedPlan = workspace.billingPlans.find((p: any) => p.name === durationType && p.isActive !== false);
    if (matchedPlan) {
      return Number(matchedPlan.price);
    }
  }

  // Fallback to legacy structure
  const hourly = Number(workspace.hourlyPrice !== undefined && Number(workspace.hourlyPrice) > 0 
    ? workspace.hourlyPrice 
    : (workspace.hourlyRate || 35));
    
  const daily = Number(workspace.dailyPrice !== undefined && Number(workspace.dailyPrice) > 0 
    ? workspace.dailyPrice 
    : (workspace.dailyRate || hourly * 6));
    
  const weekly = Number(workspace.weeklyPrice !== undefined && Number(workspace.weeklyPrice) > 0 
    ? workspace.weeklyPrice 
    : daily * 5);
    
  const monthly = Number(workspace.monthlyPrice !== undefined && Number(workspace.monthlyPrice) > 0 
    ? workspace.monthlyPrice 
    : weekly * 3.5);
    
  const yearly = Number(workspace.yearlyPrice !== undefined && Number(workspace.yearlyPrice) > 0 
    ? workspace.yearlyPrice 
    : monthly * 10);

  switch (durationType) {
    case 'Hourly':
      return hourly;
    case 'Daily':
      return daily;
    case 'Weekly':
      return weekly;
    case 'Monthly':
      return monthly;
    case 'Yearly':
      return yearly;
    default:
      return daily;
  }
}

/**
 * Calculates total breakdown including base subtotal, service fee, and total amount.
 */
export function calculateBookingPrices(workspace: any, durationType: DurationType, quantity: number, desks: number = 1, feePercentage: number = 0.15) {
  const qty = Math.max(1, Number(quantity) || 1);
  const dsk = Math.max(1, Number(desks) || 1);

  let unitPrice = 0;
  let vatRate = feePercentage; // default 15%
  let foundPlan = false;

  // Search in billing plans
  if (workspace && workspace.billingPlans && Array.isArray(workspace.billingPlans)) {
    const matchedPlan = workspace.billingPlans.find((p: any) => p.name === durationType && p.isActive !== false);
    if (matchedPlan) {
      unitPrice = Number(matchedPlan.price);
      vatRate = (matchedPlan.vat !== undefined ? matchedPlan.vat : 15) / 100;
      foundPlan = true;
    }
  }

  if (!foundPlan) {
    unitPrice = getWorkspaceUnitPrice(workspace, durationType);
  }
  
  const subtotal = unitPrice * qty * dsk;
  const serviceFee = subtotal * vatRate;
  const totalAmount = subtotal + serviceFee;

  return {
    unitPrice,
    quantity: qty,
    desks: dsk,
    subtotal,
    serviceFee,
    totalAmount,
  };
}
