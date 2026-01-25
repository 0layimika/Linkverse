import { Model, ModelObject } from 'objection';
import { CreatorModel } from './CreatorModel';

export class WalletModel extends Model {
    static tableName = "wallets";

    id!: number;
    creator_id!: number;
    balance!: number;
    currency!: string;
    created_at!: string;
    updated_at!: string;

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
                relation: Model.BelongsToOneRelation,
                modelClass: CreatorModel,
                join: {
                    from: "wallets.creator_id",
                    to: "creators.id",
                },
            },
            transactions: {
                relation: Model.HasManyRelation,
                modelClass: () => require('./TransactionModel').TransactionModel,
                join: {
                    from: "wallets.id",
                    to: "transactions.wallet_id",
                },
            },
        };
    }
}

export type WalletModelType = ModelObject<WalletModel>;
