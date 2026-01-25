import { Model, ModelObject } from 'objection';
import { WalletModel } from './WalletModel';
export type TransactionType = 'gift' | 'withdrawal';
export type TransactionStatus = 'pending' | 'completed' | 'failed';
export declare class TransactionModel extends Model {
    static tableName: string;
    id: number;
    wallet_id: number;
    type: TransactionType;
    amount: number;
    currency: string;
    status: TransactionStatus;
    reference: string;
    provider: string;
    provider_reference: string | null;
    description: string | null;
    sender_name: string | null;
    sender_email: string | null;
    metadata: Record<string, any> | null;
    created_at: string;
    updated_at: string;
    static get jsonSchema(): {
        type: string;
        required: string[];
        properties: {
            id: {
                type: string;
            };
            wallet_id: {
                type: string;
            };
            type: {
                type: string;
                enum: string[];
            };
            amount: {
                type: string;
            };
            currency: {
                type: string;
            };
            status: {
                type: string;
                enum: string[];
            };
            reference: {
                type: string;
            };
            provider: {
                type: string;
            };
            provider_reference: {
                type: string[];
            };
            description: {
                type: string[];
            };
            sender_name: {
                type: string[];
            };
            sender_email: {
                type: string[];
            };
            metadata: {
                type: string[];
            };
        };
    };
    static get relationMappings(): {
        wallet: {
            relation: import("objection").RelationType;
            modelClass: typeof WalletModel;
            join: {
                from: string;
                to: string;
            };
        };
    };
}
export type TransactionModelType = ModelObject<TransactionModel>;
//# sourceMappingURL=TransactionModel.d.ts.map