import { Request, Response } from "express";
import { ExpressResponse, BadRequest, InternalError, Ok } from "../utils/response";
import { uploadFileService, deleteFileService } from "../services/media.service";
import { cloudinary } from "../config/storage.config";
import { CLOUDINARY_API_KEY, CLOUDINARY_CLOUD_NAME } from "../config/env";

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
        return ExpressResponse(res, InternalError(error?.message || "Failed to upload file"));
    }
};

export const signUpload = async (req: Request, res: Response) => {
    try {
        const apiSecret = cloudinary.config().api_secret as string | undefined;
        if (!CLOUDINARY_API_KEY || !CLOUDINARY_CLOUD_NAME || !apiSecret) {
            return ExpressResponse(res, InternalError("Cloudinary is not configured"));
        }

        const timestamp = Math.floor(Date.now() / 1000);
        const folder = (req.body?.folder as string | undefined) || "creatorlink";
        const requestedFormat = req.body?.format as string | undefined;
        const allowedFormats = new Set(["jpg", "jpeg", "png", "webp", "avif"]);
        const format = requestedFormat && allowedFormats.has(requestedFormat.toLowerCase())
            ? requestedFormat.toLowerCase()
            : undefined;

        const paramsToSign: Record<string, string | number> = {
            timestamp,
            folder,
        };
        if (format) {
            paramsToSign.format = format;
        }

        const signature = cloudinary.utils.api_sign_request(
            paramsToSign,
            apiSecret
        );

        return ExpressResponse(
            res,
            Ok(
                {
                    timestamp,
                    signature,
                    apiKey: CLOUDINARY_API_KEY,
                    cloudName: CLOUDINARY_CLOUD_NAME,
                    folder,
                    format,
                },
                "Upload signature generated"
            )
        );
    } catch (error: any) {
        console.error("Sign upload controller error:", error);
        return ExpressResponse(res, InternalError(error?.message || "Failed to sign upload"));
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
