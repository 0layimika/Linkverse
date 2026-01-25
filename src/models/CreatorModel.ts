import { Model, ModelObject} from 'objection';
import {UserModel} from "./UserModel";

export class CreatorModel extends Model {
    static tableName = "creators";

    id!: number;
    username!: string;
    user_id!: number;
    created_at!: string;
    updated_at!: string;
    avatar_url!: string;
    first_name!: string;
    last_name!: string;
    bio!: string;

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
                relation: Model.BelongsToOneRelation,
                modelClass: UserModel,
                join: {
                    from: "creators.user_id",
                    to: "users.id",
                },
            },
            links: {
                relation: Model.HasManyRelation,
                modelClass: () => require('./LinkModel').LinkModel,
                join: {
                    from: "creators.id",
                    to: "links.creator_id",
                },
            },
            wallet: {
                relation: Model.HasOneRelation,
                modelClass: () => require('./WalletModel').WalletModel,
                join: {
                    from: "creators.id",
                    to: "wallets.creator_id",
                },
            },
            bankAccount: {
                relation: Model.HasOneRelation,
                modelClass: () => require('./BankAccountModel').BankAccountModel,
                join: {
                    from: "creators.id",
                    to: "bank_accounts.creator_id",
                },
            },
        };
    }
}

export type CreatorModelType = ModelObject<CreatorModel>