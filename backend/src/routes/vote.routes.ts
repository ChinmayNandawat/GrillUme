import { Router } from 'express';
import { deleteVote, getVotesByRoastId, upsertVote } from '../controllers/vote.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/roast/:roastId', getVotesByRoastId);
router.post('/', authenticateToken, upsertVote);
router.delete('/roast/:roastId', authenticateToken, deleteVote);

export default router;