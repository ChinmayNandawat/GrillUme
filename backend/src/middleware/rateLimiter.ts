import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

/**
 * Global API Rate Limiter
 * Used for all general API routes to prevent basic DDoS and excessive polling.
 */
export const globalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS, 
  max: env.RATE_LIMIT_MAX, 
  message: { message: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true, 
  legacyHeaders: false,
});

/**
 * Strict Auth Limiter
 * Applied to login and registration routes to prevent brute-force credential stuffing.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.AUTH_RATE_LIMIT_MAX, // Default 25 attempts
  message: { message: 'Too many login attempts from this IP, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Upload Limiter
 * Stricter limit on file uploads to protect Cloudinary bandwidth and free tiers.
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Max 10 uploads per hour per IP
  message: { message: 'Upload limit reached. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Action Limiter (Roasts & Votes)
 * Prevent spam across database write operations.
 */
export const actionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 roasts/votes per IP per 15 mins
  message: { message: 'Too many actions from this IP, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});
