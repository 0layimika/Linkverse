import { z } from 'zod';
export declare const registerSchema: z.ZodObject<{
    body: z.ZodObject<{
        email: z.ZodString;
        password: z.ZodString;
        confirmPassword: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export type registerSchema = z.infer<typeof registerSchema>;
export declare const verifySchema: z.ZodObject<{
    query: z.ZodObject<{
        token: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export type verifySchema = z.infer<typeof verifySchema>;
export declare const ForgotPassword: z.ZodObject<{
    body: z.ZodObject<{
        email: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export type ForgotPassword = z.infer<typeof ForgotPassword>;
export declare const ResetPassword: z.ZodObject<{
    body: z.ZodObject<{
        newPassword: z.ZodString;
        confirmPassword: z.ZodString;
    }, z.core.$strip>;
    query: z.ZodObject<{
        token: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export type ResetPassword = z.infer<typeof ResetPassword>;
export declare const loginSchema: z.ZodObject<{
    body: z.ZodObject<{
        email: z.ZodString;
        password: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export type loginSchema = z.infer<typeof loginSchema>;
export declare const resendVerificationSchema: z.ZodObject<{
    body: z.ZodObject<{
        email: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export type resendVerificationSchema = z.infer<typeof resendVerificationSchema>;
export declare const resendForgotPasswordSchema: z.ZodObject<{
    body: z.ZodObject<{
        email: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export type resendForgotPasswordSchema = z.infer<typeof resendForgotPasswordSchema>;
//# sourceMappingURL=auth.validator.d.ts.map