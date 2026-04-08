import { Router } from 'express';
import { createResume, deleteResume, getResumeById, getResumeRoastsById, updateResume, getResumes, uploadResumeFile, getMyResumes} from '../controllers/resume.controller';
import { authenticateOptionalToken, authenticateToken } from '../middleware/auth';
import { uploadResumeMiddleware, validateUploadMagicBytes } from '../middleware/upload';
import { uploadLimiter, actionLimiter } from '../middleware/rateLimiter';
import { validateRequest } from '../middleware/validate';
import { listResumesQuerySchema } from '../validation/schemas';

const router = Router();

router.get('/', validateRequest({ query: listResumesQuerySchema }), getResumes);
router.get('/mine', authenticateToken, getMyResumes);
router.get('/:id/roasts', authenticateOptionalToken, getResumeRoastsById);
router.get('/:id', authenticateOptionalToken, getResumeById);
router.post('/upload', authenticateToken, uploadLimiter, uploadResumeMiddleware.single('file'), validateUploadMagicBytes, uploadResumeFile);
router.post('/', authenticateToken, actionLimiter, createResume);
router.patch('/:id', authenticateToken, actionLimiter, updateResume);
router.delete('/:id', authenticateToken, deleteResume);

export default router;