// import { S3Client } from "@aws-sdk/client-s3";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

// export const STORAGE_PROVIDER = (process.env.STORAGE_PROVIDER || "CLOUDINARY") as "CLOUDINARY" | "AWS_S3";

// AWS S3 Configuration
// export const s3Client = new S3Client({
//     region: process.env.AWS_REGION || "us-east-1",
//     credentials: {
//         accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
//         secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
//     },
// });

// export const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET || "";

// Cloudinary Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
    api_key: process.env.CLOUDINARY_API_KEY || "",
    api_secret: process.env.CLOUDINARY_API_SECRET || "",
});

export { cloudinary };

