import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { BadRequestException } from '@nestjs/common';

// Allowed file types and their MIME types
export const ALLOWED_FILE_TYPES = {
  // Documents
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'application/vnd.ms-powerpoint': '.ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
  'text/plain': '.txt',
  'text/csv': '.csv',

  // Images
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',

  // Archives
  'application/zip': '.zip',
  'application/x-rar-compressed': '.rar',
};

// Maximum file size (10MB)
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Upload directory
export const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

/**
 * Multer configuration for file uploads
 */
export const multerConfig: MulterOptions = {
  storage: diskStorage({
    destination: (req, file, cb) => {
      // Create uploads directory if it doesn't exist
      const uploadPath = join(UPLOAD_DIR, new Date().getFullYear().toString());

      if (!existsSync(uploadPath)) {
        mkdirSync(uploadPath, { recursive: true });
      }

      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      // Generate unique filename: timestamp-randomstring-originalname
      const randomName = Array(32)
        .fill(null)
        .map(() => Math.round(Math.random() * 16).toString(16))
        .join('');
      const ext = extname(file.originalname);
      const filename = `${Date.now()}-${randomName}${ext}`;

      cb(null, filename);
    },
  }),
  fileFilter: (req, file, cb) => {
    // Check if file type is allowed
    if (!ALLOWED_FILE_TYPES[file.mimetype]) {
      return cb(
        new BadRequestException(
          `File type not allowed. Allowed types: ${Object.values(ALLOWED_FILE_TYPES).join(', ')}`
        ),
        false,
      );
    }

    cb(null, true);
  },
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
};

/**
 * Get file extension from MIME type
 */
export function getFileExtension(mimeType: string): string {
  return ALLOWED_FILE_TYPES[mimeType] || '';
}

/**
 * Format file size to human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
