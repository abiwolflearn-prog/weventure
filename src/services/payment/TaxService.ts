import { logger } from '../../utils/logger';

export interface TaxCalculationResult {
  subtotal: number;
  discount: number;
  taxAmount: number;
  serviceFee: number;
  grandTotal: number;
  taxRate: number;
  serviceFeeRate: number;
}

export class TaxService {
  private defaultTaxRate = 0.15; // 15% VAT (standard in Ethiopia and other regional enterprise nodes)
  private defaultServiceFeeRate = 0.02; // 2% booking process fee

  /**
   * Calculate full invoice costs
   */
  public calculateCheckoutCosts(
    subtotal: number,
    discountAmount = 0,
    options?: { taxRate?: number; serviceFeeRate?: number }
  ): TaxCalculationResult {
    logger.info(`🔢 Tax calculation initiated. Subtotal: ${subtotal}, Discount: ${discountAmount}`);

    const taxRate = options?.taxRate !== undefined ? options.taxRate : this.defaultTaxRate;
    const serviceFeeRate = options?.serviceFeeRate !== undefined ? options.serviceFeeRate : this.defaultServiceFeeRate;

    // Subtotal after applying discount
    const netSubtotal = Math.max(0, subtotal - discountAmount);

    // Calculate Tax & Fees over net amount
    const taxAmount = Number((netSubtotal * taxRate).toFixed(2));
    const serviceFee = Number((netSubtotal * serviceFeeRate).toFixed(2));

    const grandTotal = Number((netSubtotal + taxAmount + serviceFee).toFixed(2));

    return {
      subtotal,
      discount: discountAmount,
      taxAmount,
      serviceFee,
      grandTotal,
      taxRate,
      serviceFeeRate,
    };
  }
}

export const taxService = new TaxService();
