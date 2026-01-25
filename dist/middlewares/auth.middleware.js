"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const response_1 = require("../utils/response");
const env_1 = require("../config/env");
const auth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];
    if (!token)
        return (0, response_1.ExpressResponse)(res, (0, response_1.Unauthorized)("Token not provided in header"));
    try {
        const payload = jsonwebtoken_1.default.verify(token, env_1.JWT_SECRET);
        req.user = payload;
        next();
    }
    catch (error) {
        console.error(error);
        return (0, response_1.ExpressResponse)(res, (0, response_1.Unauthorized)("Expired or Invalid Token"));
    }
};
exports.auth = auth;
//# sourceMappingURL=auth.middleware.js.map