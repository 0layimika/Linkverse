import { z } from "zod";

export const initiateGiftSchema = z.object({
    params: z.object({
        username: z.string({ message: "Creator username is required" }),
    }),
    body: z.object({
        amount: z.number({ message: "Amount is required" }).min(100, "Minimum gift amount is 100 Naira"),
        sender_name: z.string().optional(),
        sender_email: z.string({ message: "Email is required" }).email("Invalid email format"),
        description: z.string().max(200, "Description is too long").optional(),
    }),
});

export type initiateGiftSchema = z.infer<typeof initiateGiftSchema>;

export const verifyGiftSchema = z.object({
    query: z.object({
        reference: z.string({ message: "Reference is required" }),
    }),
});

export type verifyGiftSchema = z.infer<typeof verifyGiftSchema>;
