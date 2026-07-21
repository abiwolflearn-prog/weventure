import { Router } from 'express';
import { paymentController } from '../controllers/PaymentController';
import { authGuard } from '../middleware/authGuard';
import { hasRoles } from '../middleware/roleGuard';
import { UserRole } from '../types';

const paymentRouter = Router();

/**
 * Public Webhook endpoint
 */
paymentRouter.post('/webhooks/chapa', paymentController.handleChapaWebhook);
paymentRouter.post('/webhooks/arifpay', paymentController.handleArifPayWebhook);

/**
 * Payment Config endpoints
 */
paymentRouter.get('/config/arifpay', authGuard, paymentController.getPaymentConfig);
paymentRouter.post(
  '/config/arifpay',
  authGuard,
  hasRoles([UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN]),
  paymentController.savePaymentConfig
);

/**
 * Secure checkout initialization
 */
paymentRouter.post('/', authGuard, paymentController.createPayment);

/**
 * Verify a completed checkout payment
 */
paymentRouter.get('/verify/:txRef', authGuard, paymentController.verifyPayment);

/**
 * Transaction lists
 */
paymentRouter.get('/transactions', authGuard, paymentController.getTransactions);

/**
 * Invoice endpoints
 */
paymentRouter.get('/invoices', authGuard, paymentController.getInvoices);
paymentRouter.get('/invoices/:id', authGuard, paymentController.getInvoiceById);
paymentRouter.get('/invoices/:id/download', authGuard, paymentController.downloadInvoicePdf);

/**
 * Refund endpoints
 */
paymentRouter.post('/refunds', authGuard, paymentController.requestRefund);

paymentRouter.get(
  '/refunds',
  authGuard,
  hasRoles([UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN]),
  paymentController.getRefunds
);

paymentRouter.post(
  '/refunds/:id/approve',
  authGuard,
  hasRoles([UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN]),
  paymentController.approveRefund
);

paymentRouter.post(
  '/refunds/:id/reject',
  authGuard,
  hasRoles([UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN]),
  paymentController.rejectRefund
);

/**
 * Dashboard stats
 */
paymentRouter.get(
  '/stats',
  authGuard,
  hasRoles([UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN]),
  paymentController.getRevenueStats
);

/**
 * Promo code / coupon engine endpoints
 */
paymentRouter.post('/promo/validate', authGuard, paymentController.validatePromoCode);
paymentRouter.post('/promo', authGuard, paymentController.createPromoCode);
paymentRouter.get('/promo', authGuard, paymentController.getPromoCodes);
paymentRouter.patch('/promo/:id/toggle', authGuard, paymentController.togglePromoCode);

export default paymentRouter;
