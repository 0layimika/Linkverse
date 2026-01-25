import { z } from "zod";
export declare const trackProfileViewSchema: z.ZodObject<{
    params: z.ZodObject<{
        username: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export type trackProfileViewSchema = z.infer<typeof trackProfileViewSchema>;
export declare const trackLinkClickSchema: z.ZodObject<{
    params: z.ZodObject<{
        linkId: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export type trackLinkClickSchema = z.infer<typeof trackLinkClickSchema>;
export declare const getOverviewSchema: z.ZodObject<{
    query: z.ZodObject<{
        period: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
            today: "today";
            this_week: "this_week";
            this_month: "this_month";
            all_time: "all_time";
        }>>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type getOverviewSchema = z.infer<typeof getOverviewSchema>;
export declare const getLinkAnalyticsSchema: z.ZodObject<{
    params: z.ZodObject<{
        linkId: z.ZodString;
    }, z.core.$strip>;
    query: z.ZodObject<{
        period: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
            today: "today";
            this_week: "this_week";
            this_month: "this_month";
            all_time: "all_time";
        }>>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type getLinkAnalyticsSchema = z.infer<typeof getLinkAnalyticsSchema>;
//# sourceMappingURL=analytics.validator.d.ts.map