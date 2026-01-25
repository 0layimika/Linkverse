"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginationSchema = exports.resolveAccountSchema = exports.initiateWithdrawalSchema = exports.setBankAccountSchema = void 0;
const zod_1 = require("zod");
exports.setBankAccountSchema = zod_1.z.object({
    body: zod_1.z.object({
        account_number: zod_1.z.string({ message: "Account number is required" }).length(10, "Account number must be 10 digits"),
        bank_code: zod_1.z.string({ message: "Bank code is required" }),
    }),
});
exports.initiateWithdrawalSchema = zod_1.z.object({
    body: zod_1.z.object({
        amount: zod_1.z.number({ message: "Amount is required" }).min(1000, "Minimum withdrawal amount is 1000 Naira"),
    }),
});
exports.resolveAccountSchema = zod_1.z.object({
    query: zod_1.z.object({
        account_number: zod_1.z.string({ message: "Account number is required" }).length(10, "Account number must be 10 digits"),
        bank_code: zod_1.z.string({ message: "Bank code is required" }),
    }),
});
exports.paginationSchema = zod_1.z.object({
    query: zod_1.z.object({
        limit: zod_1.z.string().regex(/^\d+$/, "Limit must be a number").optional(),
        offset: zod_1.z.string().regex(/^\d+$/, "Offset must be a number").optional(),
        type: zod_1.z.enum(["gift", "withdrawal"]).optional(),
    }),
});
//# sourceMappingURL=withdrawal.validator.js.map