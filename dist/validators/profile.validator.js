"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfileSchema = void 0;
const zod_1 = require("zod");
exports.getProfileSchema = zod_1.z.object({
    params: zod_1.z.object({
        username: zod_1.z.string({ message: "Username is required" }).min(1, "Username cannot be empty"),
    }),
});
//# sourceMappingURL=profile.validator.js.map