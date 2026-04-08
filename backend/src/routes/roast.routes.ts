import { Router } from 'express';
import {
	addReaction,
	createRoast,
	deleteRoast,
	getRoastsByResumeId,
	removeReaction,
} from '../controllers/roast.controller';
import { authenticateOptionalToken, authenticateToken } from '../middleware/auth';
import { actionLimiter } from '../middleware/rateLimiter';

const router = Router();

router.get('/resume/:resumeId', authenticateOptionalToken, getRoastsByResumeId);
router.post('/', authenticateToken, actionLimiter, createRoast);
router.delete('/:id', authenticateToken, actionLimiter, deleteRoast);
router.post('/:id/react', authenticateToken, actionLimiter, addReaction);
router.delete('/:id/react', authenticateToken, actionLimiter, removeReaction);

export default router;