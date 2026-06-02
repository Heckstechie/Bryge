const multer = require('multer');

const MAX_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10);
const storage     = multer.memoryStorage();

// ── Product images (JPEG / PNG / WEBP only) ───────────────────────────────────
const IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) =>
    IMAGE_MIME.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error('Only JPEG, PNG and WEBP images are allowed'), false),
});

// ── Compliance documents (PDF + images) ──────────────────────────────────────
const DOC_MIME = [...IMAGE_MIME, 'application/pdf'];

const docUpload = multer({
  storage,
  limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) =>
    DOC_MIME.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error('Only PDF, JPEG, and PNG files are allowed'), false),
});

module.exports = { upload, docUpload };
