import { z } from "zod";
import { SOCIAL_PLATFORMS } from "../utils/social-links";

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
        accent_color: z.string().regex(/^#[0-9a-f]{6}$/i).nullable().optional(),
        card_style: z.enum(["solid", "outline", "glass"]).nullable().optional(),
        profile_alignment: z.enum(["left", "center", "right"]).nullable().optional(),
        avatar_shape: z.enum(["circle", "rounded"]).nullable().optional(),
        avatar_size: z.enum(["small", "medium", "large"]).nullable().optional(),
        support_button_style: z.enum(["solid", "outline"]).nullable().optional(),
        support_enabled: z.boolean().optional(),
    }),
});

export type updateProfileConfigSchema = z.infer<typeof updateProfileConfigSchema>;

const socialLinkSchema = z.object({
    platform: z.string({ message: "Social platform is required" }).trim().min(1),
    url: z.string({ message: "Social link URL is required" }).trim().min(1).max(2048),
    is_visible: z.boolean().optional(),
});

export const getSocialLinksSchema = z.object({
    body: z.optional(z.any()),
    params: z.optional(z.any()),
    query: z.optional(z.any()),
});

export type getSocialLinksSchema = z.infer<typeof getSocialLinksSchema>;

export const replaceSocialLinksSchema = z.object({
    body: z.object({
        social_links: z.array(socialLinkSchema).max(SOCIAL_PLATFORMS.length),
    }).superRefine(({ social_links }, context) => {
        const platforms = new Set<string>();
        let visibleCount = 0;
        social_links.forEach((socialLink, index) => {
            const normalizedPlatform = socialLink.platform.trim().toLowerCase();
            if (!SOCIAL_PLATFORMS.includes(normalizedPlatform as typeof SOCIAL_PLATFORMS[number])) {
                context.addIssue({
                    code: "custom",
                    message: "Unsupported social platform",
                    path: ["social_links", index, "platform"],
                });
            }
            if (platforms.has(normalizedPlatform)) {
                context.addIssue({
                    code: "custom",
                    message: "Each social platform can only be added once",
                    path: ["social_links", index, "platform"],
                });
            }
            platforms.add(normalizedPlatform);
            if (socialLink.is_visible !== false && socialLink.url.trim()) visibleCount += 1;
        });
        if (visibleCount > 4) {
            context.addIssue({ code: "custom", message: "You can show up to four social links", path: ["social_links"] });
        }
    }),
});

export type replaceSocialLinksSchema = z.infer<typeof replaceSocialLinksSchema>;

export const getProfileQRSchema = z.object({
    params: z.object({
        username: z.string({ message: "Username is required" }).min(1, "Username cannot be empty"),
    }),
});

export type getProfileQRSchema = z.infer<typeof getProfileQRSchema>;
