"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadSingle = exports.validateFileSize = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const response_1 = require("../utils/response");
// Allowed file types
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/svg+xml", "image/heis"];
const ALLOWED_DOCUMENT_TYPES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    "text/csv",
];
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES];
// File size limits (in bytes)
const MAX_IMAGE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_DOCUMENT_SIZE = 50 * 1024 * 1024; // 50MB
// Configure multer with memory storage
const storage = multer_1.default.memoryStorage();
// File filter function
const fileFilter = (_req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error(`Invalid file type. Allowed types: ${ALLOWED_TYPES.join(", ")}`));
    }
};
// Create multer instance
exports.upload = (0, multer_1.default)({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: MAX_DOCUMENT_SIZE, // Use document size as max
    },
});
// Middleware to validate file size based on type
const validateFileSize = (req, res, next) => {
    if (!req.file) {
        return (0, response_1.ExpressResponse)(res, (0, response_1.BadRequest)("No file provided"));
    }
    const file = req.file;
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.mimetype);
    const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_DOCUMENT_SIZE;
    if (file.size > maxSize) {
        const maxSizeMB = maxSize / (1024 * 1024);
        return (0, response_1.ExpressResponse)(res, (0, response_1.BadRequest)(`File size is too large to be uploaded. File should not exceed ${maxSizeMB}.`));
    }
    return next();
};
exports.validateFileSize = validateFileSize;
// Single file upload middleware
exports.uploadSingle = exports.upload.single("file");
//# sourceMappingURL=upload.middleware.js.map