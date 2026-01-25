"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RESEND_API_KEY = exports.PAYMENT_CALLBACK_URL = exports.EMAIL_SERVICE_URL = exports.FRONTEND_URL = exports.KORA_ENCRYPTION_KEY = exports.KORA_PUBLIC_KEY = exports.KORA_SECRET_KEY = exports.PAYSTACK_SECRET_KEY = exports.PAYMENT_PROVIDER = exports.JWT_SECRET = void 0;
require("dotenv/config");
exports.JWT_SECRET = process.env.JWT_SECRET || "supersecret";
// Payment provider configuration
exports.PAYMENT_PROVIDER = process.env.PAYMENT_PROVIDER || "paystack";
// Paystack
exports.PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";
// Kora
exports.KORA_SECRET_KEY = process.env.KORA_SECRET_KEY || "";
exports.KORA_PUBLIC_KEY = process.env.KORA_PUBLIC_KEY || "";
exports.KORA_ENCRYPTION_KEY = process.env.KORA_ENCRYPTION_KEY || "";
// Frontend URL - default to localhost:3000 for development
exports.FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
exports.EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL || "http://localhost:8000/waitlist/send-email";
// Payment callback URL
exports.PAYMENT_CALLBACK_URL = process.env.PAYMENT_CALLBACK_URL || "";
exports.RESEND_API_KEY = process.env.RESEND_API_KEY || "";
//# sourceMappingURL=env.js.map