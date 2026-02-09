import { Router } from 'express';
import { register, login, getMe } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { authLoginSchema, authRegisterSchema } from '../validation/schemas';

const router = Router();

router.post('/register', validateRequest({ body: authRegisterSchema }), register);
router.post('/login', validateRequest({ body: authLoginSchema }), login);
router.get('/me', authenticateToken, getMe);

export default router;