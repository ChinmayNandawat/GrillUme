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
        req.body = schema.body.parse(req.body) as Request['body'];
      }

      if (schema.query) {
        req.query = schema.query.parse(req.query) as Request['query'];
      }

      if (schema.params) {
        req.params = schema.params.parse(req.params) as Request['params'];
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
