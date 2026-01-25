"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
const TransactionModel_1 = require("../models/TransactionModel");
class TransactionRepositoryClass extends BaseRepository_1.BaseRepository {
    constructor() {
        super(TransactionModel_1.TransactionModel);
    }
    async getByReference(reference) {
        return await TransactionModel_1.TransactionModel.query().findOne({ reference });
    }
    async getByProviderReference(providerReference) {
        return await TransactionModel_1.TransactionModel.query().findOne({ provider_reference: providerReference });
    }
    async updateStatus(id, status, providerReference, trx) {
        const updateData = { status };
        if (providerReference) {
            updateData.provider_reference = providerReference;
        }
        return await TransactionModel_1.TransactionModel.query(trx).patchAndFetchById(id, updateData);
    }
    async getTransactionsForWallet(walletId, limit = 50, offset = 0) {
        return await TransactionModel_1.TransactionModel.query()
            .where({ wallet_id: walletId })
            .orderBy('created_at', 'desc')
            .limit(limit)
            .offset(offset);
    }
    async getGiftsForWallet(walletId, limit = 50, offset = 0) {
        return await TransactionModel_1.TransactionModel.query()
            .where({ wallet_id: walletId, type: 'gift' })
            .orderBy('created_at', 'desc')
            .limit(limit)
            .offset(offset);
    }
    async getWithdrawalsForWallet(walletId, limit = 50, offset = 0) {
        return await TransactionModel_1.TransactionModel.query()
            .where({ wallet_id: walletId, type: 'withdrawal' })
            .orderBy('created_at', 'desc')
            .limit(limit)
            .offset(offset);
    }
}
exports.TransactionRepository = new TransactionRepositoryClass();
//# sourceMappingURL=TransactionRepository.js.map