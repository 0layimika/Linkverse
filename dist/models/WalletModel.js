"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletModel = void 0;
const objection_1 = require("objection");
const CreatorModel_1 = require("./CreatorModel");
class WalletModel extends objection_1.Model {
    static get jsonSchema() {
        return {
            type: "object",
            required: ["creator_id"],
            properties: {
                id: { type: "integer" },
                creator_id: { type: "integer" },
                balance: { type: "number" },
                currency: { type: "string" },
            },
        };
    }
    static get relationMappings() {
        return {
            creator: {
                relation: objection_1.Model.BelongsToOneRelation,
                modelClass: CreatorModel_1.CreatorModel,
                join: {
                    from: "wallets.creator_id",
                    to: "creators.id",
                },
            },
            transactions: {
                relation: objection_1.Model.HasManyRelation,
                modelClass: () => require('./TransactionModel').TransactionModel,
                join: {
                    from: "wallets.id",
                    to: "transactions.wallet_id",
                },
            },
        };
    }
}
exports.WalletModel = WalletModel;
WalletModel.tableName = "wallets";
//# sourceMappingURL=WalletModel.js.map