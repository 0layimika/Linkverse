"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletService = void 0;
const WalletRepository_1 = require("../repositories/WalletRepository");
const TransactionRepository_1 = require("../repositories/TransactionRepository");
const CreatorRepository_1 = require("../repositories/CreatorRepository");
const api_response_kit_1 = require("@0layimika/api-response-kit");
const knex_1 = __importDefault(require("../db/knex"));
class WalletService {
    static async getOrCreateWallet(creatorId) {
        try {
            let wallet = await WalletRepository_1.WalletRepository.getByCreatorId(creatorId);
            if (!wallet) {
                wallet = await WalletRepository_1.WalletRepository.createForCreator(creatorId);
            }
            return wallet;
        }
        catch (err) {
            throw new Error(`Failed to get/create wallet: ${err.message}`);
        }
    }
    static async getMyWallet(userId) {
        try {
            const creator = await CreatorRepository_1.CreatorRepository.getOneWhere({ user_id: userId });
            if (!creator) {
                return (0, api_response_kit_1.NotFound)("Creator profile not found");
            }
            const wallet = await this.getOrCreateWallet(creator.id);
            return (0, api_response_kit_1.Ok)(wallet, "Wallet retrieved successfully");
        }
        catch (err) {
            return (0, api_response_kit_1.InternalError)(err.message);
        }
    }
    static async getWalletBalance(userId) {
        try {
            const creator = await CreatorRepository_1.CreatorRepository.getOneWhere({ user_id: userId });
            if (!creator) {
                return (0, api_response_kit_1.NotFound)("Creator profile not found");
            }
            const wallet = await this.getOrCreateWallet(creator.id);
            return (0, api_response_kit_1.Ok)({ balance: wallet.balance, currency: wallet.currency }, "Balance retrieved successfully");
        }
        catch (err) {
            return (0, api_response_kit_1.InternalError)(err.message);
        }
    }
    static async getTransactionHistory(userId, type, limit = 50, offset = 0) {
        try {
            const creator = await CreatorRepository_1.CreatorRepository.getOneWhere({ user_id: userId });
            if (!creator) {
                return (0, api_response_kit_1.NotFound)("Creator profile not found");
            }
            const wallet = await this.getOrCreateWallet(creator.id);
            let transactions;
            if (type === 'gift') {
                transactions = await TransactionRepository_1.TransactionRepository.getGiftsForWallet(wallet.id, limit, offset);
            }
            else if (type === 'withdrawal') {
                transactions = await TransactionRepository_1.TransactionRepository.getWithdrawalsForWallet(wallet.id, limit, offset);
            }
            else {
                transactions = await TransactionRepository_1.TransactionRepository.getTransactionsForWallet(wallet.id, limit, offset);
            }
            return (0, api_response_kit_1.Ok)(transactions, "Transactions retrieved successfully");
        }
        catch (err) {
            return (0, api_response_kit_1.InternalError)(err.message);
        }
    }
    static async creditWallet(walletId, amount, transactionId) {
        const trx = await knex_1.default.transaction();
        try {
            const wallet = await WalletRepository_1.WalletRepository.creditWallet(walletId, amount, trx);
            await TransactionRepository_1.TransactionRepository.updateStatus(transactionId, 'completed', undefined, trx);
            await trx.commit();
            return wallet;
        }
        catch (err) {
            await trx.rollback();
            throw new Error(`Failed to credit wallet: ${err.message}`);
        }
    }
}
exports.WalletService = WalletService;
//# sourceMappingURL=wallet.service.js.map