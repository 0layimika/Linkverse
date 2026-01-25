import { Model, ModelObject } from 'objection';
import { CreatorModel } from './CreatorModel';
export declare class BankAccountModel extends Model {
    static tableName: string;
    id: number;
    creator_id: number;
    account_number: string;
    account_name: string;
    bank_code: string;
    bank_name: string;
    recipient_code: string | null;
    provider: string | null;
    created_at: string;
    updated_at: string;
    static get jsonSchema(): {
        type: string;
        required: string[];
        properties: {
            id: {
                type: string;
            };
            creator_id: {
                type: string;
            };
            account_number: {
                type: string;
            };
            account_name: {
                type: string;
            };
            bank_code: {
                type: string;
            };
            bank_name: {
                type: string;
            };
            recipient_code: {
                type: string[];
            };
            provider: {
                type: string[];
            };
        };
    };
    static get relationMappings(): {
        creator: {
            relation: import("objection").RelationType;
            modelClass: typeof CreatorModel;
            join: {
                from: string;
                to: string;
            };
        };
    };
}
export type BankAccountModelType = ModelObject<BankAccountModel>;
//# sourceMappingURL=BankAccountModel.d.ts.map