import { z } from "zod";
import { MAX_GIFT_AMOUNTS } from '../config/gift.config';

export const initiateGiftSchema = z.object({
    params: z.object({
        username: z.string({ message: "Creator username is required" }),
    }),
    body: z.object({
        amount: z.number({ message: "Amount is required" }).positive(),
        currency: z.enum(["NGN", "USD"]).default("NGN"),
        sender_name: z.string().optional(),
        sender_email: z.string({ message: "Email is required" }).email("Invalid email format"),
        description: z.string().max(200, "Description is too long").optional(),
    }).superRefine((body, ctx) => {
        const maximum = MAX_GIFT_AMOUNTS[body.currency];
        if (body.amount > maximum) {
            ctx.addIssue({
                code: 'too_big', origin: 'number', maximum, inclusive: true, path: ['amount'],
                message: `Maximum gift amount is ${maximum.toLocaleString('en-US')} ${body.currency}`,
            });
        }
    }),
});

export type initiateGiftSchema = z.infer<typeof initiateGiftSchema>;

export const verifyGiftSchema = z.object({
    query: z.object({
        reference: z.string({ message: "Reference is required" }),
    }),
});

export type verifyGiftSchema = z.infer<typeof verifyGiftSchema>;
