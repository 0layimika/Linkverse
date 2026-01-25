"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletController = void 0;
const response_1 = require("../utils/response");
const wallet_service_1 = require("../services/wallet.service");
const gift_service_1 = require("../services/gift.service");
class WalletController {
    static async getMyWallet(req, res) {
        try {
            const result = await wallet_service_1.WalletService.getMyWallet(req.user.id);
            return (0, response_1.ExpressResponse)(res, result);
        }
        catch (err) {
            return (0, response_1.ExpressResponse)(res, (0, response_1.InternalError)(err.message));
        }
    }
    static async getWalletBalance(req, res) {
        try {
            const result = await wallet_service_1.WalletService.getWalletBalance(req.user.id);
            return (0, response_1.ExpressResponse)(res, result);
        }
        catch (err) {
            return (0, response_1.ExpressResponse)(res, (0, response_1.InternalError)(err.message));
        }
    }
    static async getTransactionHistory(req, res) {
        try {
            const type = req.query.type;
            const limit = req.query.limit ? parseInt(req.query.limit) : 50;
            const offset = req.query.offset ? parseInt(req.query.offset) : 0;
            const result = await wallet_service_1.WalletService.getTransactionHistory(req.user.id, type, limit, offset);
            return (0, response_1.ExpressResponse)(res, result);
        }
        catch (err) {
            return (0, response_1.ExpressResponse)(res, (0, response_1.InternalError)(err.message));
        }
    }
    // Public endpoint - gift a creator
    static async initiateGift(req, res) {
        try {
            const username = req.params.username;
            const result = await gift_service_1.GiftService.initiateGift(username, req.body);
            return (0, response_1.ExpressResponse)(res, result);
        }
        catch (err) {
            return (0, response_1.ExpressResponse)(res, (0, response_1.InternalError)(err.message));
        }
    }
    // Verify payment callback
    static async verifyGiftPayment(req, res) {
        try {
            const { reference } = req.query;
            const result = await gift_service_1.GiftService.verifyGiftPayment(reference);
            return (0, response_1.ExpressResponse)(res, result);
        }
        catch (err) {
            return (0, response_1.ExpressResponse)(res, (0, response_1.InternalError)(err.message));
        }
    }
    // Webhook handlers
    static async handlePaystackWebhook(req, res) {
        try {
            const signature = req.headers['x-paystack-signature'];
            const payload = JSON.stringify(req.body);
            const result = await gift_service_1.GiftService.handleWebhook('paystack', payload, signature, req.body);
            return (0, response_1.ExpressResponse)(res, result);
        }
        catch (err) {
            return (0, response_1.ExpressResponse)(res, (0, response_1.InternalError)(err.message));
        }
    }
    static async handleKoraWebhook(req, res) {
        try {
            const signature = req.headers['x-korapay-signature'];
            const payload = JSON.stringify(req.body);
            const result = await gift_service_1.GiftService.handleWebhook('kora', payload, signature, req.body);
            return (0, response_1.ExpressResponse)(res, result);
        }
        catch (err) {
            return (0, response_1.ExpressResponse)(res, (0, response_1.InternalError)(err.message));
        }
    }
}
exports.WalletController = WalletController;
//# sourceMappingURL=wallet.controller.js.map