import multer from 'multer';
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE_BYTES } from './upload.constants';
import { BadRequestError } from '@errors';

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_SIZE_BYTES },
  fileFilter(_req, file, cb) {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new BadRequestError(`File type not allowed: ${file.mimetype}`));
    }
  },
});
