import { Router } from 'express';
import { authController } from '../controllers/AuthController';
import { authGuard } from '../middleware/authGuard';

const authRouter = Router();

/**
 * @route   POST /api/v1/auth/login
 * @desc    Authenticate user and set cookie
 * @access  Public
 */
authRouter.post('/login', authController.login);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user and clear cookie
 * @access  Public
 */
authRouter.post('/logout', authController.logout);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Fetch active user identity context
 * @access  Private (Requires JWT token)
 */
authRouter.get('/me', authGuard, authController.me);

export default authRouter;
