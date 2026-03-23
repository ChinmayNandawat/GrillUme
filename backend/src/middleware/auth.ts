import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface AuthRequest extends Request {
  userId?: string;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ message: 'Access denied: No token provided' });
    return;
  }

  try {
    const verified = jwt.verify(token, env.JWT_SECRET) as { userId: string };
    req.userId = verified.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Access denied: Invalid or expired token' });
  }
};