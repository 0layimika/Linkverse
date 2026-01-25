"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
const WalletModel_1 = require("../models/WalletModel");
class WalletRepositoryClass extends BaseRepository_1.BaseRepository {
    constructor() {
        super(WalletModel_1.WalletModel);
    }
    async getByCreatorId(creatorId) {
        return await WalletModel_1.WalletModel.query().findOne({ creator_id: creatorId });
    }
    async creditWallet(walletId, amount, trx) {
        return await WalletModel_1.WalletModel.query(trx)
            .patchAndFetchById(walletId, {
            balance: WalletModel_1.WalletModel.raw('balance + ?', [amount])
        });
    }
    async debitWallet(walletId, amount, trx) {
        return await WalletModel_1.WalletModel.query(trx)
            .patchAndFetchById(walletId, {
            balance: WalletModel_1.WalletModel.raw('balance - ?', [amount])
        });
    }
    async createForCreator(creatorId, trx) {
        return await WalletModel_1.WalletModel.query(trx).insert({
            creator_id: creatorId,
            balance: 0,
            currency: 'NGN'
        });
    }
}
exports.WalletRepository = new WalletRepositoryClass();
//# sourceMappingURL=WalletRepository.js.map