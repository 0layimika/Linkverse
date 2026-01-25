"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WithdrawalController = void 0;
const response_1 = require("../utils/response");
const withdrawal_service_1 = require("../services/withdrawal.service");
class WithdrawalController {
    static async getBanks(_req, res) {
        try {
            const result = await withdrawal_service_1.WithdrawalService.getBanks();
            return (0, response_1.ExpressResponse)(res, result);
        }
        catch (err) {
            return (0, response_1.ExpressResponse)(res, (0, response_1.InternalError)(err.message));
        }
    }
    static async resolveAccountNumber(req, res) {
        try {
            const { account_number, bank_code } = req.query;
            const result = await withdrawal_service_1.WithdrawalService.resolveAccountNumber(account_number, bank_code);
            return (0, response_1.ExpressResponse)(res, result);
        }
        catch (err) {
            return (0, response_1.ExpressResponse)(res, (0, response_1.InternalError)(err.message));
        }
    }
    static async setBankAccount(req, res) {
        try {
            const result = await withdrawal_service_1.WithdrawalService.setBankAccount(req.user.id, req.body);
            return (0, response_1.ExpressResponse)(res, result);
        }
        catch (err) {
            return (0, response_1.ExpressResponse)(res, (0, response_1.InternalError)(err.message));
        }
    }
    static async getBankAccount(req, res) {
        try {
            const result = await withdrawal_service_1.WithdrawalService.getBankAccount(req.user.id);
            return (0, response_1.ExpressResponse)(res, result);
        }
        catch (err) {
            return (0, response_1.ExpressResponse)(res, (0, response_1.InternalError)(err.message));
        }
    }
    static async initiateWithdrawal(req, res) {
        try {
            const result = await withdrawal_service_1.WithdrawalService.initiateWithdrawal(req.user.id, req.body);
            return (0, response_1.ExpressResponse)(res, result);
        }
        catch (err) {
            return (0, response_1.ExpressResponse)(res, (0, response_1.InternalError)(err.message));
        }
    }
    static async getWithdrawalHistory(req, res) {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit) : 50;
            const offset = req.query.offset ? parseInt(req.query.offset) : 0;
            const result = await withdrawal_service_1.WithdrawalService.getWithdrawalHistory(req.user.id, limit, offset);
            return (0, response_1.ExpressResponse)(res, result);
        }
        catch (err) {
            return (0, response_1.ExpressResponse)(res, (0, response_1.InternalError)(err.message));
        }
    }
}
exports.WithdrawalController = WithdrawalController;
//# sourceMappingURL=withdrawal.controller.js.map