import { Router } from 'express';
import { createResume, deleteResume, getResumeById, updateResume, getResumes, uploadResumeFile, getMyResumes} from '../controllers/resume.controller';
import { authenticateToken } from '../middleware/auth';
import { uploadResumeMiddleware } from '../middleware/upload';
import { uploadLimiter, actionLimiter } from '../middleware/rateLimiter';
import { validateRequest } from '../middleware/validate';
import { listResumesQuerySchema } from '../validation/schemas';

const router = Router();

router.get('/', validateRequest({ query: listResumesQuerySchema }), getResumes);
router.get('/mine', authenticateToken, getMyResumes);
router.get('/:id', getResumeById);
router.post('/upload', authenticateToken, uploadLimiter, uploadResumeMiddleware.single('file'), uploadResumeFile);
router.post('/', authenticateToken, actionLimiter, createResume);
router.patch('/:id', authenticateToken, actionLimiter, updateResume);
router.delete('/:id', authenticateToken, deleteResume);

export default router;