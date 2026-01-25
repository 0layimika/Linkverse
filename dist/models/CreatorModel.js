"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreatorModel = void 0;
const objection_1 = require("objection");
const UserModel_1 = require("./UserModel");
class CreatorModel extends objection_1.Model {
    // Optional: JSON schema for validation at DB level
    static get jsonSchema() {
        return {
            type: "object",
            required: ["username", "user_id"],
            properties: {
                id: { type: "integer" },
                username: { type: "string", minLength: 3, maxLength: 50 },
                user_id: { type: "integer" },
                avatar_url: { type: "string" },
            },
        };
    }
    // Optional: relationships
    static get relationMappings() {
        return {
            user: {
                relation: objection_1.Model.BelongsToOneRelation,
                modelClass: UserModel_1.UserModel,
                join: {
                    from: "creators.user_id",
                    to: "users.id",
                },
            },
            links: {
                relation: objection_1.Model.HasManyRelation,
                modelClass: () => require('./LinkModel').LinkModel,
                join: {
                    from: "creators.id",
                    to: "links.creator_id",
                },
            },
            wallet: {
                relation: objection_1.Model.HasOneRelation,
                modelClass: () => require('./WalletModel').WalletModel,
                join: {
                    from: "creators.id",
                    to: "wallets.creator_id",
                },
            },
            bankAccount: {
                relation: objection_1.Model.HasOneRelation,
                modelClass: () => require('./BankAccountModel').BankAccountModel,
                join: {
                    from: "creators.id",
                    to: "bank_accounts.creator_id",
                },
            },
        };
    }
}
exports.CreatorModel = CreatorModel;
CreatorModel.tableName = "creators";
//# sourceMappingURL=CreatorModel.js.map