"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
const response_1 = require("../utils/response");
class AuthController {
    static async register(req, res) {
        try {
            const result = await auth_service_1.AuthService.register(req.body);
            return (0, response_1.ExpressResponse)(res, result);
        }
        catch (err) {
            return (0, response_1.ExpressResponse)(res, (0, response_1.InternalError)(err.message));
        }
    }
    static async verify(req, res) {
        try {
            const { query } = req;
            const result = await auth_service_1.AuthService.verify(query.token);
            return (0, response_1.ExpressResponse)(res, result);
        }
        catch (err) {
            return (0, response_1.ExpressResponse)(res, (0, response_1.InternalError)(err.message));
        }
    }
    static async forgotPassword(req, res) {
        try {
            const result = await auth_service_1.AuthService.forgotPassword(req.body.email);
            return (0, response_1.ExpressResponse)(res, result);
        }
        catch (err) {
            return (0, response_1.ExpressResponse)(res, (0, response_1.InternalError)(err.message));
        }
    }
    static async resetPassword(req, res) {
        try {
            const { query } = req;
            const result = await auth_service_1.AuthService.resetPassword(query.token, req.body.newPassword);
            return (0, response_1.ExpressResponse)(res, result);
        }
        catch (err) {
            return (0, response_1.ExpressResponse)(res, (0, response_1.InternalError)(err.message));
        }
    }
    static async login(req, res) {
        try {
            const result = await auth_service_1.AuthService.login(req.body);
            return (0, response_1.ExpressResponse)(res, result);
        }
        catch (err) {
            console.log(err);
            return (0, response_1.ExpressResponse)(res, (0, response_1.InternalError)(err.message));
        }
    }
    static async resendVerificationLink(req, res) {
        try {
            const result = await auth_service_1.AuthService.resendVerificationLink(req.body.email);
            return (0, response_1.ExpressResponse)(res, result);
        }
        catch (err) {
            return (0, response_1.ExpressResponse)(res, (0, response_1.InternalError)(err.message));
        }
    }
    static async resendForgotPasswordLink(req, res) {
        try {
            const result = await auth_service_1.AuthService.resendForgotPasswordLink(req.body.email);
            return (0, response_1.ExpressResponse)(res, result);
        }
        catch (err) {
            return (0, response_1.ExpressResponse)(res, (0, response_1.InternalError)(err.message));
        }
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=auth.controller.js.map