import path from 'path';
import { NextFunction, Request, Response } from 'express';
import { fromBuffer } from 'file-type';
import multer from 'multer';
import { AppError } from './error';

const allowedMimeTypes = new Set(['application/pdf', 'image/png', 'image/jpeg']);
const allowedExtensions = new Set(['.pdf', '.png', '.jpg', '.jpeg']);
const extensionToMime = new Map([
  ['.pdf', 'application/pdf'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
]);

const storage = multer.memoryStorage();

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (!allowedMimeTypes.has(file.mimetype)) {
    cb(new AppError(400, 'Only PDF, PNG, and JPG files are allowed', 'UNSUPPORTED_FILE_TYPE'));
    return;
  }

  cb(null, true);
};

export const uploadResumeMiddleware = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
  },
  fileFilter,
});

export const validateUploadMagicBytes = async (
  req: Request & { file?: Express.Multer.File },
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      next(new AppError(400, 'No file uploaded', 'FILE_REQUIRED'));
      return;
    }

    const extension = path.extname(req.file.originalname).toLowerCase();
    if (!allowedExtensions.has(extension)) {
      next(new AppError(400, 'Only PDF, PNG, and JPG files are allowed', 'UNSUPPORTED_FILE_TYPE'));
      return;
    }

    const detectedType = await fromBuffer(req.file.buffer);

    if (!detectedType) {
      next(
        new AppError(
          400,
          'Could not verify uploaded file type from content signature',
          'FILE_TYPE_UNDETERMINED'
        )
      );
      return;
    }

    if (!allowedMimeTypes.has(detectedType.mime)) {
      next(
        new AppError(
          400,
          `Uploaded content is ${detectedType.mime}, which is not an allowed file type`,
          'UNSUPPORTED_FILE_TYPE'
        )
      );
      return;
    }

    if (req.file.mimetype !== detectedType.mime) {
      next(
        new AppError(
          400,
          `MIME mismatch detected: declared ${req.file.mimetype} but content is ${detectedType.mime}`,
          'FILE_MIME_MISMATCH'
        )
      );
      return;
    }

    const expectedMime = extensionToMime.get(extension);
    if (expectedMime && expectedMime !== detectedType.mime) {
      next(
        new AppError(
          400,
          `Extension mismatch detected: extension ${extension} does not match file content ${detectedType.mime}`,
          'FILE_EXTENSION_MISMATCH'
        )
      );
      return;
    }

    // Keep downstream handling aligned with verified content type.
    req.file.mimetype = detectedType.mime;
    next();
  } catch (error) {
    next(new AppError(400, 'Failed to validate uploaded file content', 'FILE_VALIDATION_FAILED', error));
  }
};
