import { Router } from 'express';
import { quotationController } from '../controllers/QuotationController';
import { authGuard, optionalAuthGuard } from '../middleware/authGuard';
import { hasRoles } from '../middleware/roleGuard';
import { UserRole } from '../types';

const quotationRouter = Router();

// Banks endpoints
quotationRouter.get('/banks', authGuard, quotationController.getSettlementBanks);
quotationRouter.post(
  '/banks',
  authGuard,
  hasRoles([UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.STAFF]),
  quotationController.saveSettlementBank
);
quotationRouter.delete(
  '/banks/:bankName',
  authGuard,
  hasRoles([UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN]),
  quotationController.deleteSettlementBank
);

// Sequence helper
quotationRouter.get('/next-number', authGuard, quotationController.getNextNumber);

// Stats
quotationRouter.get('/stats', authGuard, quotationController.getQuotationStats);

// PDF Download
quotationRouter.get('/:id/pdf', optionalAuthGuard, quotationController.downloadQuotationPdf);
quotationRouter.get('/:id/download', optionalAuthGuard, quotationController.downloadQuotationPdf);

// Actions
quotationRouter.post(
  '/:id/duplicate',
  authGuard,
  hasRoles([UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.STAFF]),
  quotationController.duplicateQuotation
);

quotationRouter.post(
  '/:id/send',
  authGuard,
  hasRoles([UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.STAFF]),
  quotationController.sendQuotationEmail
);

quotationRouter.post(
  '/:id/convert-to-invoice',
  authGuard,
  hasRoles([UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.STAFF]),
  quotationController.convertToInvoice
);

quotationRouter.patch(
  '/:id/status',
  authGuard,
  hasRoles([UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.STAFF]),
  quotationController.updateQuotationStatus
);

// Standard CRUD
quotationRouter.get('/', authGuard, quotationController.getQuotations);
quotationRouter.post(
  '/',
  authGuard,
  hasRoles([UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.STAFF]),
  quotationController.createQuotation
);
quotationRouter.get('/:id', authGuard, quotationController.getQuotationById);
quotationRouter.put(
  '/:id',
  authGuard,
  hasRoles([UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.STAFF]),
  quotationController.updateQuotation
);
quotationRouter.delete(
  '/:id',
  authGuard,
  hasRoles([UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.STAFF]),
  quotationController.deleteQuotation
);

export default quotationRouter;
