import { z } from "zod";

export const getProfileSchema = z.object({
    params: z.object({
        username: z.string({ message: "Username is required" }).min(1, "Username cannot be empty"),
    }),
});

export type getProfileSchema = z.infer<typeof getProfileSchema>;

export const getProfileConfigSchema = z.object({
    body: z.optional(z.any()),
    params: z.optional(z.any()),
    query: z.optional(z.any()),
});

export type getProfileConfigSchema = z.infer<typeof getProfileConfigSchema>;

export const updateProfileConfigSchema = z.object({
    body: z.object({
        background_type: z.enum(["color", "image"]).optional(),
        background_value: z.string().nullable().optional(),
        text_color: z.string().nullable().optional(),
        support_button_text: z.string().max(50).nullable().optional(),
    }),
});

export type updateProfileConfigSchema = z.infer<typeof updateProfileConfigSchema>;

export const getProfileQRSchema = z.object({
    params: z.object({
        username: z.string({ message: "Username is required" }).min(1, "Username cannot be empty"),
    }),
});

export type getProfileQRSchema = z.infer<typeof getProfileQRSchema>;
