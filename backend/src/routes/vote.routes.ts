import { Router } from 'express';
import { deleteVote, getVotesByRoastId, upsertVote } from '../controllers/vote.controller';
import { authenticateToken } from '../middleware/auth';
import { actionLimiter } from '../middleware/rateLimiter';

const router = Router();

router.get('/roast/:roastId', getVotesByRoastId);
router.post('/', authenticateToken, actionLimiter, upsertVote);
router.delete('/roast/:roastId', authenticateToken, actionLimiter, deleteVote);

export default router;