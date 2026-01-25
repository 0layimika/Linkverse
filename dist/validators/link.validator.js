"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reorderLinksSchema = exports.linkIdParamSchema = exports.updateLinkSchema = exports.createLinkSchema = void 0;
const zod_1 = require("zod");
exports.createLinkSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string({ message: "Title is required" }).min(1, "Title cannot be empty").max(100, "Title is too long"),
        url: zod_1.z.string({ message: "URL is required" }).url("Invalid URL format"),
        icon: zod_1.z.string().optional(),
    }),
});
exports.updateLinkSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string({ message: "Link ID is required" }),
    }),
    body: zod_1.z.object({
        title: zod_1.z.string().min(1, "Title cannot be empty").max(100, "Title is too long").optional(),
        url: zod_1.z.string().url("Invalid URL format").optional(),
        icon: zod_1.z.string().optional(),
        position: zod_1.z.number().int().positive().optional(),
    }),
});
exports.linkIdParamSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string({ message: "Link ID is required" }),
    }),
});
exports.reorderLinksSchema = zod_1.z.object({
    body: zod_1.z.object({
        linkIds: zod_1.z.array(zod_1.z.number().int().positive(), { message: "Link IDs array is required" }).min(1, "At least one link ID is required"),
    }),
});
//# sourceMappingURL=link.validator.js.map