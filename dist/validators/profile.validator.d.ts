import { z } from "zod";
export declare const getProfileSchema: z.ZodObject<{
    params: z.ZodObject<{
        username: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export type getProfileSchema = z.infer<typeof getProfileSchema>;
//# sourceMappingURL=profile.validator.d.ts.map