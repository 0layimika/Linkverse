import { z } from "zod";

export const createLinkSchema = z.object({
    body: z.object({
        title: z.string({ message: "Title is required" }).min(1, "Title cannot be empty").max(100, "Title is too long"),
        url: z.string({ message: "URL is required" }).url("Invalid URL format"),
        icon: z.string().optional(),
        thumbnail_url: z.string().url("Invalid thumbnail URL").nullable().optional(),
    }),
});

export type createLinkSchema = z.infer<typeof createLinkSchema>;

export const updateLinkSchema = z.object({
    params: z.object({
        id: z.string({ message: "Link ID is required" }),
    }),
    body: z.object({
        title: z.string().min(1, "Title cannot be empty").max(100, "Title is too long").optional(),
        url: z.string().url("Invalid URL format").optional(),
        icon: z.string().optional(),
        thumbnail_url: z.string().url("Invalid thumbnail URL").nullable().optional(),
        position: z.number().int().positive().optional(),
    }),
});

export type updateLinkSchema = z.infer<typeof updateLinkSchema>;

export const linkIdParamSchema = z.object({
    params: z.object({
        id: z.string({ message: "Link ID is required" }),
    }),
});

export type linkIdParamSchema = z.infer<typeof linkIdParamSchema>;

export const reorderLinksSchema = z.object({
    body: z.object({
        linkIds: z.array(z.number().int().positive(), { message: "Link IDs array is required" }).min(1, "At least one link ID is required"),
    }),
});

export type reorderLinksSchema = z.infer<typeof reorderLinksSchema>;
