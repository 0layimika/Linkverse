"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BankAccountRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
const BankAccountModel_1 = require("../models/BankAccountModel");
class BankAccountRepositoryClass extends BaseRepository_1.BaseRepository {
    constructor() {
        super(BankAccountModel_1.BankAccountModel);
    }
    async getByCreatorId(creatorId) {
        return await BankAccountModel_1.BankAccountModel.query().findOne({ creator_id: creatorId });
    }
    async upsertForCreator(creatorId, data) {
        const existing = await this.getByCreatorId(creatorId);
        if (existing) {
            return await BankAccountModel_1.BankAccountModel.query().patchAndFetchById(existing.id, data);
        }
        return await BankAccountModel_1.BankAccountModel.query().insert({
            creator_id: creatorId,
            ...data
        });
    }
}
exports.BankAccountRepository = new BankAccountRepositoryClass();
//# sourceMappingURL=BankAccountRepository.js.map