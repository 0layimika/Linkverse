"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLinkAnalyticsSchema = exports.getOverviewSchema = exports.trackLinkClickSchema = exports.trackProfileViewSchema = void 0;
const zod_1 = require("zod");
exports.trackProfileViewSchema = zod_1.z.object({
    params: zod_1.z.object({
        username: zod_1.z.string({ message: "Username is required" }).min(1, "Username cannot be empty"),
    }),
});
exports.trackLinkClickSchema = zod_1.z.object({
    params: zod_1.z.object({
        linkId: zod_1.z.string({ message: "Link ID is required" }),
    }),
});
const periodEnum = zod_1.z.enum(["today", "this_week", "this_month", "all_time"]).default("this_week");
exports.getOverviewSchema = zod_1.z.object({
    query: zod_1.z.object({
        period: periodEnum.optional(),
    }),
});
exports.getLinkAnalyticsSchema = zod_1.z.object({
    params: zod_1.z.object({
        linkId: zod_1.z.string({ message: "Link ID is required" }),
    }),
    query: zod_1.z.object({
        period: periodEnum.optional(),
    }),
});
//# sourceMappingURL=analytics.validator.js.map