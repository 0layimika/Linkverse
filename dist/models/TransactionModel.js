"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionModel = void 0;
const objection_1 = require("objection");
const WalletModel_1 = require("./WalletModel");
class TransactionModel extends objection_1.Model {
    static get jsonSchema() {
        return {
            type: "object",
            required: ["wallet_id", "type", "amount", "reference", "provider"],
            properties: {
                id: { type: "integer" },
                wallet_id: { type: "integer" },
                type: { type: "string", enum: ["gift", "withdrawal"] },
                amount: { type: "number" },
                currency: { type: "string" },
                status: { type: "string", enum: ["pending", "completed", "failed"] },
                reference: { type: "string" },
                provider: { type: "string" },
                provider_reference: { type: ["string", "null"] },
                description: { type: ["string", "null"] },
                sender_name: { type: ["string", "null"] },
                sender_email: { type: ["string", "null"] },
                metadata: { type: ["object", "null"] },
            },
        };
    }
    static get relationMappings() {
        return {
            wallet: {
                relation: objection_1.Model.BelongsToOneRelation,
                modelClass: WalletModel_1.WalletModel,
                join: {
                    from: "transactions.wallet_id",
                    to: "wallets.id",
                },
            },
        };
    }
}
exports.TransactionModel = TransactionModel;
TransactionModel.tableName = "transactions";
//# sourceMappingURL=TransactionModel.js.map