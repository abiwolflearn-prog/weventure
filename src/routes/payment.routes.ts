import { Router } from 'express';
import { paymentController } from '../controllers/PaymentController';
import { authGuard, optionalAuthGuard } from '../middleware/authGuard';
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

const invoiceManagementRoles = [
  UserRole.SUPER_ADMIN,
  UserRole.TENANT_ADMIN,
  UserRole.FINANCE_OFFICER,
  UserRole.WORKSPACE_MANAGER,
  UserRole.EVENT_MANAGER,
  UserRole.COMMUNITY_MANAGER,
  UserRole.STAFF,
];

/**
 * Invoice endpoints
 */
paymentRouter.get('/invoices', authGuard, paymentController.getInvoices);
paymentRouter.post('/invoices', authGuard, hasRoles(invoiceManagementRoles), paymentController.createInvoice);
paymentRouter.put('/invoices/:id', authGuard, hasRoles(invoiceManagementRoles), paymentController.updateInvoice);
paymentRouter.patch('/invoices/:id', authGuard, hasRoles(invoiceManagementRoles), paymentController.updateInvoice);
paymentRouter.get('/invoices/stats', authGuard, paymentController.getInvoiceStats);
paymentRouter.get('/invoices/:id', authGuard, paymentController.getInvoiceById);
paymentRouter.delete('/invoices/:id', authGuard, hasRoles(invoiceManagementRoles), paymentController.deleteInvoice);
paymentRouter.get('/invoices/:id/download', optionalAuthGuard, paymentController.downloadInvoicePdf);
paymentRouter.get('/invoices/:id/pdf', optionalAuthGuard, paymentController.downloadInvoicePdf);
paymentRouter.get('/:id/download', optionalAuthGuard, paymentController.downloadInvoicePdf);
paymentRouter.get('/:id/pdf', optionalAuthGuard, paymentController.downloadInvoicePdf);
paymentRouter.post('/invoices/:id/email', authGuard, paymentController.emailInvoice);
paymentRouter.post('/invoices/:id/payments', authGuard, hasRoles(invoiceManagementRoles), paymentController.recordPayment);
paymentRouter.patch(
  '/invoices/:id/status',
  authGuard,
  hasRoles(invoiceManagementRoles),
  paymentController.updateInvoiceStatus
);

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
 * Settlement Bank Management endpoints
 */
paymentRouter.get('/banks', authGuard, paymentController.getBanks.bind(paymentController));
paymentRouter.post(
  '/banks',
  authGuard,
  hasRoles([UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.STAFF]),
  paymentController.createBank.bind(paymentController)
);
paymentRouter.put(
  '/banks/:id',
  authGuard,
  hasRoles([UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.STAFF]),
  paymentController.updateBank.bind(paymentController)
);
paymentRouter.delete(
  '/banks/:id',
  authGuard,
  hasRoles([UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN]),
  paymentController.deleteBank.bind(paymentController)
);
paymentRouter.patch(
  '/banks/:id/toggle',
  authGuard,
  hasRoles([UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.STAFF]),
  paymentController.toggleBank.bind(paymentController)
);

/**
 * Promo code / coupon engine endpoints
 */
paymentRouter.post('/promo/validate', authGuard, paymentController.validatePromoCode);
paymentRouter.post('/promo', authGuard, paymentController.createPromoCode);
paymentRouter.get('/promo', authGuard, paymentController.getPromoCodes);
paymentRouter.patch('/promo/:id/toggle', authGuard, paymentController.togglePromoCode);

export default paymentRouter;
