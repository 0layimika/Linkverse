"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resendForgotPasswordSchema = exports.resendVerificationSchema = exports.loginSchema = exports.ResetPassword = exports.ForgotPassword = exports.verifySchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email({ message: "Invalid email address" }),
        password: zod_1.z.string().min(8, { message: "Password must be at least 8 characters" }),
        confirmPassword: zod_1.z.string().min(8, { message: "Password must be at least 8 characters" })
    }).refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"], // 👈 attach error to this field
    })
});
exports.verifySchema = zod_1.z.object({
    query: zod_1.z.object({
        token: zod_1.z.string({ message: "Invalid token provided" }),
    })
});
exports.ForgotPassword = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email({ message: "Invalid email address" }),
    })
});
exports.ResetPassword = zod_1.z.object({
    body: zod_1.z.object({
        newPassword: zod_1.z.string().min(8, { message: "Password must be at least 8 characters" }),
        confirmPassword: zod_1.z.string().min(8, { message: "Password must be at least 8 characters" }),
    }).refine((data) => data.newPassword === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"], // 👈 attach error to this field
    }),
    query: zod_1.z.object({
        token: zod_1.z.string({ message: "Invalid token provided" }),
    })
});
exports.loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email({ message: "Invalid email address" }),
        password: zod_1.z.string().min(8, { message: "Password must be at least 8 characters" })
    }),
});
exports.resendVerificationSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email({ message: "Invalid email address" }),
    })
});
exports.resendForgotPasswordSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email({ message: "Invalid email address" }),
    })
});
//# sourceMappingURL=auth.validator.js.map