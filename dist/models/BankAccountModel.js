"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BankAccountModel = void 0;
const objection_1 = require("objection");
const CreatorModel_1 = require("./CreatorModel");
class BankAccountModel extends objection_1.Model {
    static get jsonSchema() {
        return {
            type: "object",
            required: ["creator_id", "account_number", "account_name", "bank_code", "bank_name"],
            properties: {
                id: { type: "integer" },
                creator_id: { type: "integer" },
                account_number: { type: "string" },
                account_name: { type: "string" },
                bank_code: { type: "string" },
                bank_name: { type: "string" },
                recipient_code: { type: ["string", "null"] },
                provider: { type: ["string", "null"] },
            },
        };
    }
    static get relationMappings() {
        return {
            creator: {
                relation: objection_1.Model.BelongsToOneRelation,
                modelClass: CreatorModel_1.CreatorModel,
                join: {
                    from: "bank_accounts.creator_id",
                    to: "creators.id",
                },
            },
        };
    }
}
exports.BankAccountModel = BankAccountModel;
BankAccountModel.tableName = "bank_accounts";
//# sourceMappingURL=BankAccountModel.js.map