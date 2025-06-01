// src/middleware/multer.ts

import multer from "multer";
import path from "path";
import fs from "fs";

//
// 1) Avatar‐only Multer (for user avatars)
//
const avatarsDir = path.join(__dirname, "../../uploads/avatars");
if (!fs.existsSync(avatarsDir)) fs.mkdirSync(avatarsDir, { recursive: true });

export const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, avatarsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    cb(null, `${base}-${Date.now()}${ext}`);
  },
});

export const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB max
  fileFilter: (req, file, cb) => {
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      // + either allow octet-stream here or check via extension:
      "application/octet-stream",
    ];

    // If file.mimetype is application/octet-stream, fall back to checking extension:
    if (file.mimetype === "application/octet-stream") {
      const ext = path.extname(file.originalname).toLowerCase();
      if ([".jpg", ".jpeg", ".png"].includes(ext)) {
        return cb(null, true);
      } else {
        return cb(new Error("نوع الملف غير مدعوم. فقط JPEG و PNG مسموح بهما."));
      }
    }

    if (allowed.includes(file.mimetype)) {
      return cb(null, true);
    }

    cb(new Error("نوع الملف غير مدعوم. فقط JPEG و PNG مسموح بهما."));
  },
});

//
// 2) “Offering Images” Multer (for vendor offerings—multiple images under “images”)
//
const offeringsDir = path.join(__dirname, "../../uploads/offerings");
if (!fs.existsSync(offeringsDir))
  fs.mkdirSync(offeringsDir, { recursive: true });

export const offeringStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, offeringsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    cb(null, `${base}-${Date.now()}${ext}`);
  },
});

export const uploadOfferingImages = multer({
  storage: offeringStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max per image
  fileFilter: (req, file, cb) => {
    console.log("File type:", file.mimetype);

    const allowedMimes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      "image/bmp",
      "image/tiff",
      "image/heic",
      "image/heif",
      "image/avif",
      "image/x-icon",
      "image/jxl",
      "image/ico",
      "image/cur",
      // include octet-stream so that Android’s fallback format is accepted:
      "application/octet-stream",
    ];

    if (file.mimetype === "application/octet-stream") {
      // Fallback: check extension if mimetype is octet-stream
      const ext = path.extname(file.originalname).toLowerCase();
      if (
        [
          ".jpg",
          ".jpeg",
          ".png",
          ".gif",
          ".webp",
          ".bmp",
          ".tiff",
          ".heic",
          ".heif",
          ".avif",
          ".ico",
        ].includes(ext)
      ) {
        return cb(null, true);
      } else {
        return cb(new Error("نوع الملف غير مدعوم. فقط أنواع الصور مسموح بها."));
      }
    }

    if (allowedMimes.includes(file.mimetype)) {
      return cb(null, true);
    }

    cb(new Error("نوع الملف غير مدعوم. فقط أنواع الصور مسموح بها."));
  },
});
