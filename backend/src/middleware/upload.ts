import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';
import { AppError } from './error';


const uploadsDir = path.join(__dirname, '..', '..', 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const allowedMimeTypes = new Set(['application/pdf', 'image/png', 'image/jpeg']);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ext || '.bin';
    const fileName = `${Date.now()}-${crypto.randomUUID()}${safeExt}`;
    cb(null, fileName);
  },
});

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
