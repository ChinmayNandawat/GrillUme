import { Router } from 'express';
import {
	beginGoogleAuth,
	checkUsernameAvailability,
	completeGoogleAuth,
	completeOnboarding,
	getMe,
	logout,
	refreshSession,
} from '../controllers/auth.controller';
import { authenticateSupabaseToken, authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import {
	completeOnboardingSchema,
	googleCallbackSchema,
	usernameAvailabilityQuerySchema,
} from '../validation/schemas';
import { actionLimiter, authLimiter, globalLimiter } from '../middleware/rateLimiter';

const router = Router();

router.get('/google/url', authLimiter, beginGoogleAuth);
router.post('/google/callback', authLimiter, validateRequest({ body: googleCallbackSchema }), completeGoogleAuth);
router.get(
	'/username-availability',
	authLimiter,
	validateRequest({ query: usernameAvailabilityQuerySchema }),
	checkUsernameAvailability
);
router.post(
	'/onboarding/complete',
	actionLimiter,
	authenticateSupabaseToken,
	validateRequest({ body: completeOnboardingSchema }),
	completeOnboarding
);
router.get('/me', authenticateToken, getMe);
router.post('/refresh', globalLimiter, refreshSession);
router.post('/logout', logout);

export default router;