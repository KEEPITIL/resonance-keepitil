const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.AWS_S3_BUCKET;

const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

// ── Multer-S3 upload factory ──────────────────────────────────────────────────
const createUploader = (folder = 'uploads', maxSizeMB = 10) =>
  multer({
    storage: multerS3({
      s3,
      bucket: BUCKET,
      contentType: multerS3.AUTO_CONTENT_TYPE,
      key: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const key = `${folder}/${uuidv4()}${ext}`;
        cb(null, key);
      },
      metadata: (req, file, cb) => {
        cb(null, { fieldName: file.fieldname });
      },
    }),
    limits: { fileSize: maxSizeMB * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (allowedImageTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'), false);
      }
    },
  });

// ── Upload a buffer directly ──────────────────────────────────────────────────
const uploadBuffer = async (buffer, key, contentType = 'image/png') => {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });
  await s3.send(command);
  return `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};

// ── Delete a file ─────────────────────────────────────────────────────────────
const deleteFile = async (key) => {
  const command = new DeleteObjectCommand({ Bucket: BUCKET, Key: key });
  await s3.send(command);
};

// ── Get public URL ────────────────────────────────────────────────────────────
const getPublicUrl = (key) =>
  `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

// Pre-configured uploaders
const profilePhotoUpload = createUploader('profiles', 5);
const bannerUpload = createUploader('banners', 10);
const eventCoverUpload = createUploader('events', 10);
const galleryUpload = createUploader('gallery', 15);
const logoUpload = createUploader('logos', 5);

module.exports = {
  s3,
  createUploader,
  uploadBuffer,
  deleteFile,
  getPublicUrl,
  profilePhotoUpload,
  bannerUpload,
  eventCoverUpload,
  galleryUpload,
  logoUpload,
};
