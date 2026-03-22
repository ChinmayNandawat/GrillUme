import 'dotenv/config';
import { z } from 'zod';

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3001),
    TRUST_PROXY: z.coerce.number().int().min(0).default(1),
    FRONTEND_URL: z.string().trim().min(1, 'FRONTEND_URL is required'),
    JWT_SECRET: z.string().min(8, 'JWT_SECRET must be at least 8 characters'),
    SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
    SUPABASE_SERVICE_KEY: z.string().min(1, 'SUPABASE_SERVICE_KEY is required'),
    SUPABASE_RESUME_BUCKET: z.string().trim().min(1).default('resumes'),
    CLOUDINARY_CLOUD_NAME: z.string().trim().min(1, 'CLOUDINARY_CLOUD_NAME is required'),
    CLOUDINARY_API_KEY: z.string().trim().min(1, 'CLOUDINARY_API_KEY is required'),
    CLOUDINARY_API_SECRET: z.string().trim().min(1, 'CLOUDINARY_API_SECRET is required'),
    CLOUDINARY_FOLDER: z.string().trim().min(1).default('roastume/resumes'),
    RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
    RATE_LIMIT_MAX: z.coerce.number().int().positive().default(600),
    AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(25),
  })
  .superRefine((input, ctx) => {
    if (input.NODE_ENV === 'production' && input.JWT_SECRET.length < 32) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'JWT_SECRET must be at least 32 characters in production',
        path: ['JWT_SECRET'],
      });
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const flattened = parsed.error.flatten().fieldErrors;
  throw new Error(`Invalid server environment configuration: ${JSON.stringify(flattened)}`);
}

const raw = parsed.data;
const allowedOrigins = raw.FRONTEND_URL.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export const env = {
  ...raw,
  allowedOrigins,
  isProduction: raw.NODE_ENV === 'production',
};
