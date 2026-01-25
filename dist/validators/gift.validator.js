"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyGiftSchema = exports.initiateGiftSchema = void 0;
const zod_1 = require("zod");
exports.initiateGiftSchema = zod_1.z.object({
    params: zod_1.z.object({
        username: zod_1.z.string({ message: "Creator username is required" }),
    }),
    body: zod_1.z.object({
        amount: zod_1.z.number({ message: "Amount is required" }).min(100, "Minimum gift amount is 100 Naira"),
        sender_name: zod_1.z.string().optional(),
        sender_email: zod_1.z.string({ message: "Email is required" }).email("Invalid email format"),
        description: zod_1.z.string().max(200, "Description is too long").optional(),
    }),
});
exports.verifyGiftSchema = zod_1.z.object({
    query: zod_1.z.object({
        reference: zod_1.z.string({ message: "Reference is required" }),
    }),
});
//# sourceMappingURL=gift.validator.js.map