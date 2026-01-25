import { z } from "zod";
export declare const createLinkSchema: z.ZodObject<{
    body: z.ZodObject<{
        title: z.ZodString;
        url: z.ZodString;
        icon: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type createLinkSchema = z.infer<typeof createLinkSchema>;
export declare const updateLinkSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
    body: z.ZodObject<{
        title: z.ZodOptional<z.ZodString>;
        url: z.ZodOptional<z.ZodString>;
        icon: z.ZodOptional<z.ZodString>;
        position: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type updateLinkSchema = z.infer<typeof updateLinkSchema>;
export declare const linkIdParamSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export type linkIdParamSchema = z.infer<typeof linkIdParamSchema>;
export declare const reorderLinksSchema: z.ZodObject<{
    body: z.ZodObject<{
        linkIds: z.ZodArray<z.ZodNumber>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type reorderLinksSchema = z.infer<typeof reorderLinksSchema>;
//# sourceMappingURL=link.validator.d.ts.map