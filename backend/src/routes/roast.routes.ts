import { Router } from 'express';
import { createRoast, deleteRoast, getRoastsByResumeId } from '../controllers/roast.controller';
import { authenticateToken } from '../middleware/auth';
import { actionLimiter } from '../middleware/rateLimiter';

const router = Router();

router.get('/resume/:resumeId', getRoastsByResumeId);
router.post('/', authenticateToken, actionLimiter, createRoast);
router.delete('/:id', authenticateToken, actionLimiter, deleteRoast);

export default router;