import { z } from "zod";
export declare const initiateGiftSchema: z.ZodObject<{
    params: z.ZodObject<{
        username: z.ZodString;
    }, z.core.$strip>;
    body: z.ZodObject<{
        amount: z.ZodNumber;
        sender_name: z.ZodOptional<z.ZodString>;
        sender_email: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type initiateGiftSchema = z.infer<typeof initiateGiftSchema>;
export declare const verifyGiftSchema: z.ZodObject<{
    query: z.ZodObject<{
        reference: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export type verifyGiftSchema = z.infer<typeof verifyGiftSchema>;
//# sourceMappingURL=gift.validator.d.ts.map