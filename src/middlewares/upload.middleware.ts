import multer from "multer";
import { Request } from "express";

import { Response, NextFunction } from "express";
import {BadRequest, ExpressResponse} from "../utils/response";

// Allowed file types
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/svg+xml", "image/heic", "image/heif"];
const ALLOWED_DOCUMENT_TYPES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    "text/csv",
    "application/zip",
    "application/x-zip-compressed",
    "application/x-7z-compressed",
    "application/x-rar-compressed",
];

const ALLOWED_AUDIO_TYPES = [
    "audio/mpeg",
    "audio/wav",
    "audio/x-wav",
    "audio/flac",
    "audio/aac",
    "audio/mp4",
    "audio/ogg",
];

const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES, ...ALLOWED_AUDIO_TYPES];

// File size limits (in bytes) - align with Cloudinary free tier limit
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB

// Configure multer with memory storage
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback): void => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type. Allowed types: ${ALLOWED_TYPES.join(", ")}`));
    }
};

// Create multer instance
export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: MAX_DOCUMENT_SIZE, // Use document size as max
    },
});

// Middleware to validate file size based on type
export const validateFileSize = (req: Request, res: Response, next: NextFunction): Response | void => {
    if (!req.file) {
        return ExpressResponse(res,BadRequest("No file provided"));
    }

    const file = req.file;
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.mimetype);
    const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_DOCUMENT_SIZE;

    if (file.size > maxSize) {
        const maxSizeMB = maxSize / (1024 * 1024);
        return ExpressResponse(res,BadRequest(`File size is too large to be uploaded. File should not exceed ${maxSizeMB}.`));
    }

    return next();
};

// Single file upload middleware
export const uploadSingle = upload.single("file");
