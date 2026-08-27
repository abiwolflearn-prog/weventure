import { Router } from 'express';
import { authController } from '../controllers/AuthController';
import { authGuard } from '../middleware/authGuard';
import { hasRoles } from '../middleware/roleGuard';
import { UserRole } from '../types';

const authRouter = Router();

/**
 * @route   POST /api/v1/auth/login
 * @desc    Authenticate user and set cookie
 * @access  Public
 */
authRouter.post('/login', (req, res, next) => {
  authController.login(req, res, next);
});

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register new user account and trigger welcome & OTP email
 * @access  Public
 */
authRouter.post('/register', (req, res, next) => {
  authController.register(req, res, next);
});

/**
 * @route   POST /api/v1/auth/verify-email
 * @route   GET /api/v1/auth/verify-email
 * @desc    Verify email address using token or OTP code
 * @access  Public
 */
authRouter.post('/verify-email', (req, res, next) => {
  authController.verifyEmail(req, res, next);
});

authRouter.get('/verify-email', (req, res, next) => {
  authController.verifyEmail(req, res, next);
});

/**
 * @route   POST /api/v1/auth/resend-verification
 * @desc    Resend verification email to user
 * @access  Public
 */
authRouter.post('/resend-verification', (req, res, next) => {
  authController.resendVerification(req, res, next);
});

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Request password reset email
 * @access  Public
 */
authRouter.post('/forgot-password', (req, res, next) => {
  authController.requestPasswordReset(req, res, next);
});

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Complete password reset
 * @access  Public
 */
authRouter.post('/reset-password', (req, res, next) => {
  authController.resetPassword(req, res, next);
});

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user and clear cookie
 * @access  Public
 */
authRouter.post('/logout', (req, res, next) => {
  authController.logout(req, res, next);
});

/**
 * @route   GET /api/v1/auth/me
 * @desc    Fetch active user identity context
 * @access  Private (Requires JWT token)
 */
authRouter.get('/me', authGuard, (req, res, next) => {
  authController.me(req, res, next);
});

/**
 * User administration endpoints (Strict RBAC Protected)
 */
authRouter.get(
  '/users',
  authGuard,
  hasRoles([UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.STAFF, UserRole.COMMUNITY_MANAGER]),
  (req, res, next) => {
    authController.getUsers(req, res, next);
  }
);

authRouter.post(
  '/users',
  authGuard,
  hasRoles([UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.STAFF]),
  (req, res, next) => {
    authController.createUser(req, res, next);
  }
);

authRouter.patch(
  '/users/:id/role',
  authGuard,
  hasRoles([UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN]),
  (req, res, next) => {
    authController.updateUserRole(req, res, next);
  }
);

authRouter.delete(
  '/users/:id',
  authGuard,
  hasRoles([UserRole.SUPER_ADMIN]),
  (req, res, next) => {
    authController.deleteUser(req, res, next);
  }
);

export default authRouter;
