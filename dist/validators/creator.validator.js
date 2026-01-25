"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSchema = exports.createSchema = void 0;
const zod_1 = require("zod");
exports.createSchema = zod_1.z.object({
    body: zod_1.z.object({
        username: zod_1.z.string({ message: "Invalid username provided" }),
        first_name: zod_1.z.string({ message: "Invalid first name provided" }),
        last_name: zod_1.z.string({ message: "Invalid last name provided" }),
        bio: zod_1.z.string({ message: "Invalid bio name provided" }).optional(),
        avatar_url: zod_1.z.string({ message: "Invalid avatar provided" }).optional(),
    })
});
exports.updateSchema = zod_1.z.object({
    body: zod_1.z.object({
        username: zod_1.z.string({ message: "Invalid username provided" }).optional(),
        first_name: zod_1.z.string({ message: "Invalid first name provided" }).optional(),
        last_name: zod_1.z.string({ message: "Invalid last name provided" }).optional(),
        avatar_url: zod_1.z.string({ message: "Invalid avatar provided" }).optional(),
        bio: zod_1.z.string({ message: "Invalid bio provided" }).optional(),
    })
});
//# sourceMappingURL=creator.validator.js.map