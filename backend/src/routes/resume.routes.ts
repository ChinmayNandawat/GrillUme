import { Router } from 'express';
import { createResume, deleteResume, getResumeById, updateResume, getResumes, uploadResumeFile, getMyResumes} from '../controllers/resume.controller';
import { authenticateToken } from '../middleware/auth';
import { uploadResumeMiddleware } from '../middleware/upload';

const router = Router();

router.get('/', getResumes);
router.get('/:id', getResumeById);
router.get('/mine', authenticateToken, getMyResumes);
router.post('/upload', authenticateToken, uploadResumeMiddleware.single('file'), uploadResumeFile);
router.post('/', authenticateToken, createResume);
router.patch('/:id', authenticateToken, updateResume);
router.delete('/:id', authenticateToken, deleteResume);

export default router;