import { z } from 'zod';

const idSchema = z.string().min(1, 'id is required');
const optionalUrlSchema = z.preprocess(
  (value) => {
    if (value === '' || value === undefined) return null;
    return value;
  },
  z.string().trim().url().nullable()
);

export const googleCallbackSchema = z
  .object({
    code: z.string().trim().min(1).optional(),
    accessToken: z.string().trim().min(1).optional(),
    refreshToken: z.string().trim().min(1).optional(),
    expiresAt: z.coerce.number().int().positive().optional(),
  })
  .strict()
  .refine((payload) => Boolean(payload.code || payload.accessToken), {
    message: 'Either code or accessToken is required',
  });

export const usernameAvailabilityQuerySchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{3,24}$/, 'Username must be 3-24 chars: lowercase letters, numbers, underscore'),
});

export const completeOnboardingSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{3,24}$/, 'Username must be 3-24 chars: lowercase letters, numbers, underscore'),
});

export const listResumesQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(50).optional(),
  query: z.string().trim().max(100).optional(),
});

export const resumeIdParamSchema = z.object({
  id: idSchema,
});

export const createResumeSchema = z.object({
  title: z.string().trim().min(1).max(120),
  field: z.string().trim().min(1).max(80),
  details: z.string().trim().min(1).max(5000),
  isClassified: z.boolean().optional().default(false),
  fileUrl: optionalUrlSchema.optional(),
});

export const updateResumeSchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    field: z.string().trim().min(1).max(80).optional(),
    details: z.string().trim().min(1).max(5000).optional(),
    isClassified: z.boolean().optional(),
    fileUrl: optionalUrlSchema.optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'At least one field is required',
  });

export const resumeIdOnlyParamSchema = z.object({
  resumeId: idSchema,
});

export const roastIdParamSchema = z.object({
  id: idSchema,
});

export const createRoastSchema = z.object({
  resumeId: idSchema,
  text: z.string().trim().min(1).max(1000),
});

export const voteRoastIdParamSchema = z.object({
  roastId: idSchema,
});

export const upsertVoteSchema = z.object({
  roastId: idSchema,
  type: z.enum(['up', 'down']),
});
