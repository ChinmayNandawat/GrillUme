import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { AppError } from './error';

type RequestSchema = {
  body?: z.ZodTypeAny;
  query?: z.ZodTypeAny;
  params?: z.ZodTypeAny;
};

export const validateRequest = (schema: RequestSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schema.body) {
        schema.body.parse(req.body);
      }

      if (schema.query) {
        schema.query.parse(req.query);
      }

      if (schema.params) {
        schema.params.parse(req.params);
      }

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(
          new AppError(400, 'Request validation failed', 'VALIDATION_ERROR', {
            issues: error.issues,
          })
        );
        return;
      }

      next(error);
    }
  };
};
