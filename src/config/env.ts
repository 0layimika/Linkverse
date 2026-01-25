import 'dotenv/config';

// Server
export const PORT = process.env.PORT || 8010;
export const NODE_ENV = process.env.NODE_ENV || "development";

// Database
export const DATABASE_URL = process.env.DATABASE_URL || "postgresql://olayimika:password@localhost:5432/creatorlink";

// JWT
export const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

// CORS
export const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
export const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS || "";

// Payment provider configuration
export const PAYMENT_PROVIDER = process.env.PAYMENT_PROVIDER || "paystack";
export const PAYMENT_CALLBACK_URL = process.env.PAYMENT_CALLBACK_URL || "";

// Paystack
export const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";

// Kora
export const KORA_SECRET_KEY = process.env.KORA_SECRET_KEY || "";
export const KORA_PUBLIC_KEY = process.env.KORA_PUBLIC_KEY || "";
export const KORA_ENCRYPTION_KEY = process.env.KORA_ENCRYPTION_KEY || "";

// Email (Resend)
export const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
export const FROM_EMAIL = process.env.FROM_EMAIL || "LinkVerse <hello@linkverse.live>";

// Cloudinary
export const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "";
export const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || "";
export const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || "";
