import { z } from "zod";
export declare const setBankAccountSchema: z.ZodObject<{
    body: z.ZodObject<{
        account_number: z.ZodString;
        bank_code: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export type setBankAccountSchema = z.infer<typeof setBankAccountSchema>;
export declare const initiateWithdrawalSchema: z.ZodObject<{
    body: z.ZodObject<{
        amount: z.ZodNumber;
    }, z.core.$strip>;
}, z.core.$strip>;
export type initiateWithdrawalSchema = z.infer<typeof initiateWithdrawalSchema>;
export declare const resolveAccountSchema: z.ZodObject<{
    query: z.ZodObject<{
        account_number: z.ZodString;
        bank_code: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export type resolveAccountSchema = z.infer<typeof resolveAccountSchema>;
export declare const paginationSchema: z.ZodObject<{
    query: z.ZodObject<{
        limit: z.ZodOptional<z.ZodString>;
        offset: z.ZodOptional<z.ZodString>;
        type: z.ZodOptional<z.ZodEnum<{
            gift: "gift";
            withdrawal: "withdrawal";
        }>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type paginationSchema = z.infer<typeof paginationSchema>;
//# sourceMappingURL=withdrawal.validator.d.ts.map