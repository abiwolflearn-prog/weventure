import { PromoCode, DiscountType, IPromoCodeDocument } from '../../models/PromoCode';
import { ValidationError, NotFoundError } from '../../errors/AppError';
import { logger } from '../../utils/logger';

export class DiscountService {
  /**
   * Create a promo code for a tenant
   */
  public async createPromoCode(
    tenantId: string,
    data: {
      code: string;
      discountType: 'PERCENTAGE' | 'FIXED';
      discountValue: number;
      maxUses?: number;
      expiryDate?: string | Date;
    }
  ): Promise<IPromoCodeDocument> {
    const formattedCode = data.code.toUpperCase().trim();
    logger.info(`🏷️ Creating promo code ${formattedCode} for tenant: ${tenantId}`);

    const existing = await PromoCode.findOne({ tenantId, code: formattedCode }).exec();
    if (existing) {
      throw new ValidationError(`Promo code '${formattedCode}' already exists for this tenant.`);
    }

    const promo = new PromoCode({
      tenantId,
      code: formattedCode,
      discountType: data.discountType as DiscountType,
      discountValue: data.discountValue,
      maxUses: data.maxUses,
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
      isActive: true,
    });

    return await promo.save();
  }

  /**
   * Validate a promo code against an active checkout
   */
  public async validatePromoCode(tenantId: string, code: string, subtotal: number): Promise<IPromoCodeDocument> {
    const formattedCode = code.toUpperCase().trim();
    logger.info(`🔍 Validating promo code ${formattedCode} for subtotal ${subtotal}`);

    const promo = await PromoCode.findOne({ tenantId, code: formattedCode }).exec();
    if (!promo) {
      throw new NotFoundError(`Promo code '${formattedCode}' is invalid.`);
    }

    if (!promo.isActive) {
      throw new ValidationError(`Promo code '${formattedCode}' is no longer active.`);
    }

    if (promo.expiryDate && new Date() > promo.expiryDate) {
      throw new ValidationError(`Promo code '${formattedCode}' has expired.`);
    }

    if (promo.maxUses !== undefined && promo.usesCount >= promo.maxUses) {
      throw new ValidationError(`Promo code '${formattedCode}' has reached its maximum usage limit.`);
    }

    return promo;
  }

  /**
   * Calculate discount amount
   */
  public calculateDiscount(promo: IPromoCodeDocument, subtotal: number): number {
    if (promo.discountType === DiscountType.PERCENTAGE) {
      const amount = (subtotal * promo.discountValue) / 100;
      return Math.min(amount, subtotal);
    } else {
      return Math.min(promo.discountValue, subtotal);
    }
  }

  /**
   * Increment usage count of a promo code
   */
  public async incrementUses(tenantId: string, code: string): Promise<void> {
    const formattedCode = code.toUpperCase().trim();
    await PromoCode.updateOne(
      { tenantId, code: formattedCode },
      { $inc: { usesCount: 1 } }
    ).exec();
  }

  /**
   * Get all promo codes for a tenant
   */
  public async getPromoCodes(tenantId: string): Promise<IPromoCodeDocument[]> {
    return await PromoCode.find({ tenantId }).sort({ createdAt: -1 }).exec();
  }

  /**
   * Toggle promo code active state
   */
  public async togglePromoCode(tenantId: string, id: string, isActive: boolean): Promise<IPromoCodeDocument> {
    const promo = await PromoCode.findOne({ _id: id, tenantId }).exec();
    if (!promo) {
      throw new NotFoundError('Promo code not found');
    }
    promo.isActive = isActive;
    return await promo.save();
  }
}

export const discountService = new DiscountService();
