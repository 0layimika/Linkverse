import 'dotenv/config';
import { parseGiftFeePercent } from '../utils/gift-fee';
import { moneyToMinor } from '../utils/money';

// Server
export const PORT = process.env.PORT || 8010;
export const NODE_ENV = process.env.NODE_ENV || "development";

// Database
const LOCAL_DATABASE_URL = "postgresql://olayimika@127.0.0.1:5432/creatorlink_dev";

if (NODE_ENV === "production" && !process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required in production");
}

export const DATABASE_URL = process.env.DATABASE_URL || LOCAL_DATABASE_URL;

// Redis connections are opened lazily by the cache service.
export const REDIS_URL = process.env.REDIS_URL || '';

// JWT
export const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

// CORS
export const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
export const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS || "";

// Payment provider configuration
export const PAYMENT_PROVIDER = process.env.PAYMENT_PROVIDER || "bachs";
export const PAYMENT_CALLBACK_URL = process.env.PAYMENT_CALLBACK_URL || "";

// Creator-paid gift fee, shared by NGN and USD. Set to 0 to disable.
export const GIFT_FEE_PERCENT = parseGiftFeePercent(process.env.GIFT_FEE_PERCENT ?? "2");

export const USD_SETTLEMENT_BUSINESS_DAYS = Number(process.env.USD_SETTLEMENT_BUSINESS_DAYS ?? '2.5');
if (!Number.isFinite(USD_SETTLEMENT_BUSINESS_DAYS) || USD_SETTLEMENT_BUSINESS_DAYS < 0.01 || USD_SETTLEMENT_BUSINESS_DAYS > 30
    || !/^\d+(\.\d{1,2})?$/.test(String(USD_SETTLEMENT_BUSINESS_DAYS))) {
    throw new Error('USD_SETTLEMENT_BUSINESS_DAYS must be between 0.01 and 30 with at most two decimal places');
}

export const NGN_WITHDRAWAL_FEE_MINOR = moneyToMinor(process.env.NGN_WITHDRAWAL_FEE ?? "120");
export const USD_WITHDRAWAL_FEE_PERCENT = Number(process.env.USD_WITHDRAWAL_FEE_PERCENT ?? '2');
if (!Number.isFinite(USD_WITHDRAWAL_FEE_PERCENT) || USD_WITHDRAWAL_FEE_PERCENT < 0 || USD_WITHDRAWAL_FEE_PERCENT > 100
    || !/^\d+(\.\d{1,2})?$/.test(String(USD_WITHDRAWAL_FEE_PERCENT))) {
    throw new Error('USD_WITHDRAWAL_FEE_PERCENT must be between 0 and 100 with at most two decimal places');
}
export const WITHDRAWAL_QUOTE_TTL_SECONDS = Number(process.env.WITHDRAWAL_QUOTE_TTL_SECONDS ?? "300");
if (!Number.isInteger(WITHDRAWAL_QUOTE_TTL_SECONDS) || WITHDRAWAL_QUOTE_TTL_SECONDS < 10 || WITHDRAWAL_QUOTE_TTL_SECONDS > 3600) {
    throw new Error('WITHDRAWAL_QUOTE_TTL_SECONDS must be an integer between 10 and 3600');
}

// Paystack
export const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";

// Kora
export const KORA_SECRET_KEY = process.env.KORA_SECRET_KEY || "";
export const KORA_PUBLIC_KEY = process.env.KORA_PUBLIC_KEY || "";
export const KORA_ENCRYPTION_KEY = process.env.KORA_ENCRYPTION_KEY || "";

// Bachs
export const BACHS_API_KEY = process.env.BACHS_API_KEY || "";
export const BACHS_BASE_URL = process.env.BACHS_BASE_URL || "https://sandbox-api.bachs.io";
export const BACHS_WEBHOOK_SECRET = process.env.BACHS_WEBHOOK_SECRET || "";
export const BACHS_RETURN_URL = process.env.BACHS_RETURN_URL || "";
export const BACHS_CANCEL_URL = process.env.BACHS_CANCEL_URL || "";
export const BACHS_GIFT_RETURN_URL = process.env.BACHS_GIFT_RETURN_URL || "";
export const BACHS_GIFT_CANCEL_URL = process.env.BACHS_GIFT_CANCEL_URL || "";

// Email (Resend)
export const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
export const FROM_EMAIL = process.env.FROM_EMAIL || "LinkVerse <hello@linkverse.live>";

// Cloudinary
export const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "";
export const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || "";
export const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || "";
