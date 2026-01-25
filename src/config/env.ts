export const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

// Payment provider configuration
export const PAYMENT_PROVIDER = process.env.PAYMENT_PROVIDER || "paystack";

// Paystack
export const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";

// Kora
export const KORA_SECRET_KEY = process.env.KORA_SECRET_KEY || "";
export const KORA_PUBLIC_KEY = process.env.KORA_PUBLIC_KEY || "";
export const KORA_ENCRYPTION_KEY = process.env.KORA_ENCRYPTION_KEY || "";

// Frontend URL - default to localhost:3000 for development
export const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

export const EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL || "http://localhost:8000/waitlist/send-email";

// Payment callback URL
export const PAYMENT_CALLBACK_URL = process.env.PAYMENT_CALLBACK_URL || "";

export const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
