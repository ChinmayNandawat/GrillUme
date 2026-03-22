import multer from 'multer';
import { AppError } from './error';

const allowedMimeTypes = new Set(['application/pdf', 'image/png', 'image/jpeg']);

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
