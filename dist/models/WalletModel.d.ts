import { Model, ModelObject } from 'objection';
import { CreatorModel } from './CreatorModel';
export declare class WalletModel extends Model {
    static tableName: string;
    id: number;
    creator_id: number;
    balance: number;
    currency: string;
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
            balance: {
                type: string;
            };
            currency: {
                type: string;
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
        transactions: {
            relation: import("objection").RelationType;
            modelClass: () => any;
            join: {
                from: string;
                to: string;
            };
        };
    };
}
export type WalletModelType = ModelObject<WalletModel>;
//# sourceMappingURL=WalletModel.d.ts.map