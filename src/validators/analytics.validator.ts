import { z } from "zod";

export const trackProfileViewSchema = z.object({
    params: z.object({
        username: z.string({ message: "Username is required" }).min(1, "Username cannot be empty"),
    }),
});

export type trackProfileViewSchema = z.infer<typeof trackProfileViewSchema>;

export const trackLinkClickSchema = z.object({
    params: z.object({
        linkId: z.string({ message: "Link ID is required" }),
    }),
});

export type trackLinkClickSchema = z.infer<typeof trackLinkClickSchema>;

const periodEnum = z.enum(["today", "this_week", "this_month", "all_time"]).default("this_week");

export const getOverviewSchema = z.object({
    query: z.object({
        period: periodEnum.optional(),
    }),
});

export type getOverviewSchema = z.infer<typeof getOverviewSchema>;

export const getLinkAnalyticsSchema = z.object({
    params: z.object({
        linkId: z.string({ message: "Link ID is required" }),
    }),
    query: z.object({
        period: periodEnum.optional(),
    }),
});

export type getLinkAnalyticsSchema = z.infer<typeof getLinkAnalyticsSchema>;
