import { z } from "zod";

export const setBankAccountSchema = z.object({
    body: z.object({
        account_number: z.string({ message: "Account number is required" }).length(10, "Account number must be 10 digits"),
        bank_code: z.string({ message: "Bank code is required" }),
    }),
});

export type setBankAccountSchema = z.infer<typeof setBankAccountSchema>;

export const initiateWithdrawalSchema = z.object({
    body: z.object({
        amount: z.number({ message: "Amount is required" }).positive(),
        currency: z.enum(["NGN", "USD"]).default("NGN"),
        password: z.string().min(1, "Password is required"),
    }).superRefine((body, ctx) => {
        const minimum = body.currency === "USD" ? 1 : 1000;
        if (body.amount < minimum) ctx.addIssue({ code: z.ZodIssueCode.too_small, minimum, inclusive: true, origin: "number", message: `Minimum withdrawal amount is ${minimum} ${body.currency}` });
    }),
});

export type initiateWithdrawalSchema = z.infer<typeof initiateWithdrawalSchema>;

export const resolveAccountSchema = z.object({
    query: z.object({
        account_number: z.string({ message: "Account number is required" }).length(10, "Account number must be 10 digits"),
        bank_code: z.string({ message: "Bank code is required" }),
    }),
});

export type resolveAccountSchema = z.infer<typeof resolveAccountSchema>;

export const paginationSchema = z.object({
    query: z.object({
        limit: z.string().regex(/^\d+$/, "Limit must be a number").optional(),
        offset: z.string().regex(/^\d+$/, "Offset must be a number").optional(),
        type: z.enum(["gift", "withdrawal"]).optional(),
    }),
});

export type paginationSchema = z.infer<typeof paginationSchema>;
