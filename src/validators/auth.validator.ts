import { z } from 'zod';


export const registerSchema = z.object({
    body:z.object({
        email: z.string().email({message: "Invalid email address"}),
        password: z.string().min(8, {message: "Password must be at least 8 characters"}),
        confirmPassword: z.string().min(8, {message: "Password must be at least 8 characters"})
    }).refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"], // 👈 attach error to this field
    })
});

export type registerSchema = z.infer<typeof registerSchema>

export const verifySchema = z.object({
    query: z.object({
        token:z.string({message: "Invalid token provided"}),
    })
})
export type verifySchema = z.infer<typeof verifySchema>

export const ForgotPassword = z.object({
    body:z.object({
        email: z.string().email({message: "Invalid email address"}),
    })
})

export type ForgotPassword = z.infer<typeof ForgotPassword>

export const ResetPassword = z.object({
    body:z.object({
        newPassword: z.string().min(8, {message: "Password must be at least 8 characters"}),
        confirmPassword: z.string().min(8, {message: "Password must be at least 8 characters"}),
    }).refine((data) => data.newPassword === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"], // 👈 attach error to this field
    }),
    query:z.object({
        token:z.string({message: "Invalid token provided"}),
    })
})

export type ResetPassword = z.infer<typeof ResetPassword>

export const loginSchema = z.object({
body:z.object({
    email: z.string().email({message: "Invalid email address"}),
        password
:
    z.string().min(8, {message: "Password must be at least 8 characters"})
}),
});

export type loginSchema = z.infer<typeof loginSchema>

export const resendVerificationSchema = z.object({
    body: z.object({
        email: z.string().email({ message: "Invalid email address" }),
    })
});

export type resendVerificationSchema = z.infer<typeof resendVerificationSchema>

export const resendForgotPasswordSchema = z.object({
    body: z.object({
        email: z.string().email({ message: "Invalid email address" }),
    })
});

export type resendForgotPasswordSchema = z.infer<typeof resendForgotPasswordSchema>
