import { z } from "zod";
export declare const createSchema: z.ZodObject<{
    body: z.ZodObject<{
        username: z.ZodString;
        first_name: z.ZodString;
        last_name: z.ZodString;
        bio: z.ZodOptional<z.ZodString>;
        avatar_url: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type createSchema = z.infer<typeof createSchema>;
export declare const updateSchema: z.ZodObject<{
    body: z.ZodObject<{
        username: z.ZodOptional<z.ZodString>;
        first_name: z.ZodOptional<z.ZodString>;
        last_name: z.ZodOptional<z.ZodString>;
        avatar_url: z.ZodOptional<z.ZodString>;
        bio: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type updateSchema = z.infer<typeof updateSchema>;
//# sourceMappingURL=creator.validator.d.ts.map