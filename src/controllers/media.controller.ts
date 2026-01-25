import { Request, Response } from "express";
import { ExpressResponse, BadRequest, InternalError, Ok } from "../utils/response";
import { uploadFileService, deleteFileService } from "../services/media.service";

export const uploadFile = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return ExpressResponse(res, BadRequest("No file provided"));
        }

        const file = req.file;
        const folder = req.body.folder as string | undefined;

        const result = await uploadFileService(
            file.buffer,
            file.originalname,
            file.mimetype,
            folder
        );

        if (!result.success || !result.data) {
            return ExpressResponse(
                res,
                BadRequest(result.error || "Failed to upload file")
            );
        }

        return ExpressResponse(res, Ok(result.data, "File uploaded successfully"));
    } catch (error: any) {
        console.error("Upload file controller error:", error);
        return ExpressResponse(res,InternalError("Failed to upload file"));
    }
};

export const deleteFile = async (req: Request, res: Response) => {
    try {
        const { fileId } = req.params;
        const { url } = req.body;

        const publicIdOrUrl = fileId || url;

        if (!publicIdOrUrl) {
            return ExpressResponse(res, BadRequest("File ID or URL is required"));
        }

        const result = await deleteFileService(publicIdOrUrl);

        if (!result.success) {
            return ExpressResponse(
                res,
                InternalError(result.error || "Failed to delete file")
            );
        }

        return ExpressResponse(res, Ok(null, "File deleted successfully"));
    } catch (error: any) {
        console.error("Delete file controller error:", error);
        return ExpressResponse(res, InternalError("Failed to delete file"));
    }
};

