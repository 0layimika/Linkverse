"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const response_1 = require("../utils/response");
const zod_1 = require("zod");
const validate = (schema) => {
    return (req, res, next) => {
        try {
            schema.parse({
                body: req.body,
                params: req.params,
                query: req.query,
            });
            next();
        }
        catch (err) {
            if (err instanceof zod_1.ZodError && err.issues.length > 0) {
                // Take only the first error
                const e = err.issues[0];
                const message = e.message;
                return (0, response_1.ExpressResponse)(res, (0, response_1.BadRequest)(`${message}`));
            }
            return (0, response_1.ExpressResponse)(res, (0, response_1.BadRequest)(err.message));
        }
    };
};
exports.validate = validate;
//# sourceMappingURL=validate.js.map