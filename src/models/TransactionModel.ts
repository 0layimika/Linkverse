import { Model, ModelObject } from 'objection';
import { WalletModel } from './WalletModel';

export type TransactionType = 'gift' | 'withdrawal';
export type TransactionStatus = 'pending' | 'completed' | 'failed';

export class TransactionModel extends Model {
    static tableName = "transactions";

    id!: number;
    wallet_id!: number;
    type!: TransactionType;
    amount!: number;
    currency!: string;
    status!: TransactionStatus;
    reference!: string;
    provider!: string;
    provider_reference!: string | null;
    description!: string | null;
    sender_name!: string | null;
    sender_email!: string | null;
    metadata!: Record<string, any> | null;
    created_at!: string;
    updated_at!: string;

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
                relation: Model.BelongsToOneRelation,
                modelClass: WalletModel,
                join: {
                    from: "transactions.wallet_id",
                    to: "wallets.id",
                },
            },
        };
    }
}

export type TransactionModelType = ModelObject<TransactionModel>;
