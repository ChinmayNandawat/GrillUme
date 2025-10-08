import { Router } from 'express';
import { createResume, deleteResume, getResumeById, updateResume} from '../controllers/resume.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/:id', getResumeById);
router.post('/', authenticateToken, createResume);
router.patch('/:id', authenticateToken, updateResume);
router.delete('/:id', authenticateToken, deleteResume);

export default router;