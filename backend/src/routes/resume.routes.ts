import { Router } from 'express';
import {createResume, deleteResume} from '../controllers/resume.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/', authenticateToken, createResume);
router.delete('/:id', authenticateToken, deleteResume);

export default router;