import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?: string;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!process.env.JWT_SECRET) {
    res.status(500).json({ message: 'Server configuration error: JWT secret is missing' });
    return;
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ message: 'Access denied: No token provided' });
    return;
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET) as { userId: string };
    req.userId = verified.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Access denied: Invalid or expired token' });
  }
};