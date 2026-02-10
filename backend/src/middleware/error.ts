import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import multer from 'multer';

export class AppError extends Error {
  statusCode: number;
  code: string;
  details?: unknown;

  constructor(statusCode: number, message: string, code = 'APP_ERROR', details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(new AppError(404, `Route not found: ${req.method} ${req.originalUrl}`, 'NOT_FOUND'));
};

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: err.flatten(),
      },
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  if (err instanceof multer.MulterError) {
    const code = err.code === 'LIMIT_FILE_SIZE' ? 'FILE_TOO_LARGE' : 'UPLOAD_ERROR';
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'Uploaded file exceeds the 10MB limit'
        : 'File upload failed';

    res.status(400).json({
      success: false,
      error: {
        code,
        message,
      },
    });
    return;
  }

  if (err instanceof Error) {
    console.error('Unhandled error:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Something went wrong',
      },
    });
    return;
  }

  res.status(500).json({
    success: false,
    error: {
      code: 'UNKNOWN_ERROR',
      message: 'Unexpected error',
    },
  });
};
