import { Router } from 'express';
import { reportController } from '../controllers/ReportController';
import { authGuard } from '../middleware/authGuard';
import { hasPermission } from '../middleware/roleGuard';
import { Permission } from '../types';

const reportRouter = Router();

// Protect all reports endpoints under the authGuard and ANALYTICS_READ permission boundaries
reportRouter.use(authGuard);
reportRouter.use(hasPermission(Permission.ANALYTICS_READ));

/**
 * @route   GET /api/v1/reports
 * @desc    Fetch all saved report configurations
 * @access  Private (Admins / Staff)
 */
reportRouter.get('/', reportController.getSavedReports);

/**
 * @route   POST /api/v1/reports
 * @desc    Create a new saved report config with scheduling triggers
 * @access  Private (Admins / Staff)
 */
reportRouter.post('/', reportController.createReport);

/**
 * @route   DELETE /api/v1/reports/:id
 * @desc    Delete a saved report configuration template
 * @access  Private (Admins / Staff)
 */
reportRouter.delete('/:id', reportController.deleteReport);

/**
 * @route   GET /api/v1/reports/history
 * @desc    Fetch lists of historically compiled documents / downloads
 * @access  Private (Admins / Staff)
 */
reportRouter.get('/history', reportController.getReportHistory);

/**
 * @route   POST /api/v1/reports/generate
 * @desc    Compile a report preview on-demand using temporary search parameters
 * @access  Private (Admins / Staff)
 */
reportRouter.post('/generate', reportController.generateReportData);

/**
 * @route   POST /api/v1/reports/:id/run
 * @desc    Execute a saved report IMMEDIATELY (updates history logs, sends email alerts)
 * @access  Private (Admins / Staff)
 */
reportRouter.post('/:id/run', reportController.runSavedReport);

/**
 * @route   POST /api/v1/reports/export
 * @desc    Generate printable formats or CSV/Excel Base64 data strings
 * @access  Private (Admins / Staff)
 */
reportRouter.post('/export', reportController.exportReport);

export default reportRouter;
