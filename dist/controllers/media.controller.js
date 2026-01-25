"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFile = exports.uploadFile = void 0;
const response_1 = require("../utils/response");
const media_service_1 = require("../services/media.service");
const uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return (0, response_1.ExpressResponse)(res, (0, response_1.BadRequest)("No file provided"));
        }
        const file = req.file;
        const folder = req.body.folder;
        const result = await (0, media_service_1.uploadFileService)(file.buffer, file.originalname, file.mimetype, folder);
        if (!result.success || !result.data) {
            return (0, response_1.ExpressResponse)(res, (0, response_1.BadRequest)(result.error || "Failed to upload file"));
        }
        return (0, response_1.ExpressResponse)(res, (0, response_1.Ok)(result.data, "File uploaded successfully"));
    }
    catch (error) {
        console.error("Upload file controller error:", error);
        return (0, response_1.ExpressResponse)(res, (0, response_1.InternalError)("Failed to upload file"));
    }
};
exports.uploadFile = uploadFile;
const deleteFile = async (req, res) => {
    try {
        const { fileId } = req.params;
        const { url } = req.body;
        const publicIdOrUrl = fileId || url;
        if (!publicIdOrUrl) {
            return (0, response_1.ExpressResponse)(res, (0, response_1.BadRequest)("File ID or URL is required"));
        }
        const result = await (0, media_service_1.deleteFileService)(publicIdOrUrl);
        if (!result.success) {
            return (0, response_1.ExpressResponse)(res, (0, response_1.InternalError)(result.error || "Failed to delete file"));
        }
        return (0, response_1.ExpressResponse)(res, (0, response_1.Ok)(null, "File deleted successfully"));
    }
    catch (error) {
        console.error("Delete file controller error:", error);
        return (0, response_1.ExpressResponse)(res, (0, response_1.InternalError)("Failed to delete file"));
    }
};
exports.deleteFile = deleteFile;
//# sourceMappingURL=media.controller.js.map