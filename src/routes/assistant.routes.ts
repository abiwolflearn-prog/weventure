import { Router } from 'express';
import { assistantController } from '../controllers/AssistantController';
import { optionalAuthGuard, authGuard } from '../middleware/authGuard';
import { hasRoles } from '../middleware/roleGuard';
import { UserRole } from '../types';

const assistantRouter = Router();

/**
 * @route   POST /api/v1/assistant/chat
 * @desc    Main chat messaging pipeline with Gemini reasoning & MongoDB ground-truth RAG
 * @access  Public / Optional Auth
 */
assistantRouter.post('/chat', optionalAuthGuard, (req, res, next) => {
  assistantController.handleChat(req, res, next);
});

/**
 * @route   GET /api/v1/assistant/history
 * @desc    Get session or user chat history
 * @access  Public / Optional Auth
 */
assistantRouter.get('/history', optionalAuthGuard, (req, res, next) => {
  assistantController.getHistory(req, res, next);
});

/**
 * @route   POST /api/v1/assistant/ticket
 * @desc    Create human support ticket or request human handoff
 * @access  Public / Optional Auth
 */
assistantRouter.post('/ticket', optionalAuthGuard, (req, res, next) => {
  assistantController.createSupportTicket(req, res, next);
});

/**
 * @route   POST /api/v1/assistant/feedback
 * @desc    Submit user satisfaction rating for assistant interaction
 * @access  Public
 */
assistantRouter.post('/feedback', (req, res, next) => {
  assistantController.submitFeedback(req, res, next);
});

/**
 * @route   GET /api/v1/assistant/analytics
 * @desc    Get AI assistant engagement, resolution rates, and popular topics
 * @access  Admin / Operator
 */
assistantRouter.get('/analytics', authGuard, hasRoles([UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.STAFF]), (req, res, next) => {
  assistantController.getAnalytics(req, res, next);
});

/**
 * @route   GET /api/v1/assistant/tickets
 * @desc    Get active support tickets / human handoffs for operator review
 * @access  Admin / Operator
 */
assistantRouter.get('/tickets', authGuard, hasRoles([UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.STAFF]), (req, res, next) => {
  assistantController.getTickets(req, res, next);
});

/**
 * @route   POST /api/v1/assistant/tickets/:id/reply
 * @desc    Reply to human handoff ticket from admin operator dashboard
 * @access  Admin / Operator
 */
assistantRouter.post('/tickets/:id/reply', authGuard, hasRoles([UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.STAFF]), (req, res, next) => {
  assistantController.replyTicket(req, res, next);
});

export default assistantRouter;
