import { Model, ModelObject } from 'objection';
import { CreatorModel } from './CreatorModel';

export class BankAccountModel extends Model {
    static tableName = "bank_accounts";

    id!: number;
    creator_id!: number;
    account_number!: string;
    account_name!: string;
    bank_code!: string;
    bank_name!: string;
    recipient_code!: string | null;
    provider!: string | null;
    created_at!: string;
    updated_at!: string;

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
                relation: Model.BelongsToOneRelation,
                modelClass: CreatorModel,
                join: {
                    from: "bank_accounts.creator_id",
                    to: "creators.id",
                },
            },
        };
    }
}

export type BankAccountModelType = ModelObject<BankAccountModel>;
