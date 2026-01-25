// import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import {cloudinary} from "../config/storage.config";
import { Readable } from "stream";
import { randomBytes } from "crypto";
import path from "path";

interface UploadResult {
    url: string;
    publicId: string;
    fileName: string;
    fileType: string;
    size: number;
}

const generateUniqueFileName = (originalName: string, folder?: string): string => {
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    const timestamp = Date.now();
    const uniqueId = randomBytes(4).toString("hex");
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

const uploadToCloudinary = async (
    fileBuffer: Buffer,
    fileName: string,
    contentType: string,
    folder?: string
): Promise<UploadResult> => {
    try {
        return new Promise((resolve, reject) => {
            const uploadOptions: any = {
                resource_type: "auto" as const,
                public_id: folder ? `${folder}/${path.parse(fileName).name}` : path.parse(fileName).name,
            };

            const uploadStream = cloudinary.uploader.upload_stream(
                uploadOptions,
                (error, result) => {
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
                }
            );

            // Convert buffer to stream
            const bufferStream = new Readable();
            bufferStream.push(fileBuffer);
            bufferStream.push(null);

            bufferStream.pipe(uploadStream);
        });
    } catch (error: any) {
        console.error("Cloudinary upload error:", error);
        throw new Error(`Failed to upload to Cloudinary: ${error.message}`);
    }
};

export const uploadFileService = async (
    fileBuffer: Buffer,
    originalName: string,
    mimetype: string,
    folder?: string
): Promise<{ success: boolean; data?: UploadResult; error?: string }> => {
    try {
        const fileName = generateUniqueFileName(originalName, folder);

        let result: UploadResult;

        result = await uploadToCloudinary(fileBuffer, fileName, mimetype, folder);

        return {
            success: true,
            data: result,
        };
    } catch (error: any) {
        console.error("Upload file error:", error);
        return {
            success: false,
            error: error.message || "Failed to upload file",
        };
    }
};

export const deleteFileService = async (publicIdOrUrl: string): Promise<{ success: boolean; error?: string }> => {
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
        await cloudinary.uploader.destroy(publicIdOrUrl, {
            resource_type: "auto",
        });
        return {
            success: true,
        };
    } catch (error: any) {
        console.error("Delete file error:", error);
        return {
            success: false,
            error: error.message || "Failed to delete file",
        };
    }
};

