import { Router } from 'express';
import { onboardingController } from '../controllers/OnboardingController';
import { authGuard } from '../middleware/authGuard';

const onboardingRouter = Router();

/**
 * @route   POST /api/v1/onboarding/provision
 * @desc    Self-service provision organization and admin setup
 * @access  Public
 */
onboardingRouter.post('/provision', onboardingController.provision.bind(onboardingController));

/**
 * @route   GET /api/v1/onboarding/plans
 * @desc    Retrieve default system subscription plans
 * @access  Public
 */
onboardingRouter.get('/plans', onboardingController.listPlans.bind(onboardingController));

/**
 * @route   GET /api/v1/onboarding/invitations/token/:token
 * @desc    Fetch invitation context using validation token
 * @access  Public
 */
onboardingRouter.get('/invitations/token/:token', onboardingController.getInvitationDetails.bind(onboardingController));

/**
 * @route   POST /api/v1/onboarding/invitations/accept
 * @desc    Process invitation acceptance token
 * @access  Public
 */
onboardingRouter.post('/invitations/accept', onboardingController.acceptInvitation.bind(onboardingController));

/**
 * Authenticated endpoints for managing team members & invitations within an active tenant
 */
onboardingRouter.post('/invitations', authGuard, onboardingController.inviteMember.bind(onboardingController));
onboardingRouter.get('/invitations', authGuard, onboardingController.listInvitations.bind(onboardingController));
onboardingRouter.delete('/invitations/:id', authGuard, onboardingController.revokeInvitation.bind(onboardingController));

export default onboardingRouter;
