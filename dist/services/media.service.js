"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFileService = exports.uploadFileService = void 0;
// import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
const storage_config_1 = require("../config/storage.config");
const stream_1 = require("stream");
const crypto_1 = require("crypto");
const path_1 = __importDefault(require("path"));
const generateUniqueFileName = (originalName, folder) => {
    const ext = path_1.default.extname(originalName);
    const baseName = path_1.default.basename(originalName, ext);
    const timestamp = Date.now();
    const uniqueId = (0, crypto_1.randomBytes)(4).toString("hex");
    const sanitizedName = baseName.replace(/[^a-zA-Z0-9]/g, "_");
    const fileName = `${sanitizedName}_${timestamp}_${uniqueId}${ext}`;
    if (folder) {
        return `${folder}/${fileName}`;
    }
    return fileName;
};
// const uploadToS3 = async (
//     fileBuffer: Buffer,
//     fileName: string,
//     contentType: string,
//     folder?: string
// ): Promise<UploadResult> => {
//     try {
//         const key = folder ? `${folder}/${fileName}` : fileName;
//
//         const command = new PutObjectCommand({
//             Bucket: AWS_S3_BUCKET,
//             Key: key,
//             Body: fileBuffer,
//             ContentType: contentType,
//             ACL: "public-read",
//         });
//
//         await s3Client.send(command);
//
//         // Construct public URL
//         const region = process.env.AWS_REGION || "us-east-1";
//         const url = `https://${AWS_S3_BUCKET}.s3.${region}.amazonaws.com/${key}`;
//
//         return {
//             url,
//             publicId: key,
//             fileName,
//             fileType: contentType,
//             size: fileBuffer.length,
//         };
//     } catch (error: any) {
//         console.error("S3 upload error:", error);
//         throw new Error(`Failed to upload to S3: ${error.message}`);
//     }
// };
const uploadToCloudinary = async (fileBuffer, fileName, contentType, folder) => {
    try {
        return new Promise((resolve, reject) => {
            const uploadOptions = {
                resource_type: "auto",
                public_id: folder ? `${folder}/${path_1.default.parse(fileName).name}` : path_1.default.parse(fileName).name,
            };
            const uploadStream = storage_config_1.cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
                if (error) {
                    console.error("Cloudinary upload error:", error);
                    reject(new Error(`Failed to upload to Cloudinary: ${error.message}`));
                    return;
                }
                if (!result) {
                    reject(new Error("Cloudinary upload returned no result"));
                    return;
                }
                resolve({
                    url: result.secure_url,
                    publicId: result.public_id,
                    fileName,
                    fileType: contentType,
                    size: result.bytes,
                });
            });
            // Convert buffer to stream
            const bufferStream = new stream_1.Readable();
            bufferStream.push(fileBuffer);
            bufferStream.push(null);
            bufferStream.pipe(uploadStream);
        });
    }
    catch (error) {
        console.error("Cloudinary upload error:", error);
        throw new Error(`Failed to upload to Cloudinary: ${error.message}`);
    }
};
const uploadFileService = async (fileBuffer, originalName, mimetype, folder) => {
    try {
        const fileName = generateUniqueFileName(originalName, folder);
        let result;
        result = await uploadToCloudinary(fileBuffer, fileName, mimetype, folder);
        return {
            success: true,
            data: result,
        };
    }
    catch (error) {
        console.error("Upload file error:", error);
        return {
            success: false,
            error: error.message || "Failed to upload file",
        };
    }
};
exports.uploadFileService = uploadFileService;
const deleteFileService = async (publicIdOrUrl) => {
    try {
        // if (STORAGE_PROVIDER === "AWS_S3") {
        //     // Extract key from URL or use as-is
        //     let key = publicIdOrUrl;
        //     if (publicIdOrUrl.startsWith("http")) {
        //         const urlParts = publicIdOrUrl.split("/");
        //         key = urlParts.slice(3).join("/"); // Remove protocol and domain
        //     }
        //
        //     const command = new DeleteObjectCommand({
        //         Bucket: AWS_S3_BUCKET,
        //         Key: key,
        //     });
        //
        //     await s3Client.send(command);
        // ]
        // Cloudinary deletion
        await storage_config_1.cloudinary.uploader.destroy(publicIdOrUrl, {
            resource_type: "auto",
        });
        return {
            success: true,
        };
    }
    catch (error) {
        console.error("Delete file error:", error);
        return {
            success: false,
            error: error.message || "Failed to delete file",
        };
    }
};
exports.deleteFileService = deleteFileService;
//# sourceMappingURL=media.service.js.map