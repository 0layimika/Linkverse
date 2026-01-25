"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const objection_1 = require("objection");
const CreatorModel_1 = require("./CreatorModel");
class UserModel extends objection_1.Model {
    static get relationMappings() {
        return {
            creator: {
                relation: objection_1.Model.HasOneRelation,
                modelClass: CreatorModel_1.CreatorModel,
                join: {
                    from: "users.id",
                    to: "creators.user_id",
                },
            },
        };
    }
}
exports.UserModel = UserModel;
UserModel.tableName = 'users';
UserModel.jsonSchema = {
    type: 'object',
    required: ['email', 'password_hash'],
    properties: {
        id: { type: 'integer' },
        email: { type: 'string', format: 'email' },
        password_hash: { type: 'string' },
        created_at: { type: 'string', format: 'date-time' },
        verified: { type: 'boolean' },
    },
};
//# sourceMappingURL=UserModel.js.map