import { Router } from 'express';
import { createRoast, deleteRoast, getRoastsByResumeId } from '../controllers/roast.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/resume/:resumeId', getRoastsByResumeId);
router.post('/', authenticateToken, createRoast);
router.delete('/:id', authenticateToken, deleteRoast);

export default router;