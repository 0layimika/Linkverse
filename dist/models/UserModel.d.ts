import { Model, ModelObject } from 'objection';
import { CreatorModel } from './CreatorModel';
export declare class UserModel extends Model {
    static tableName: string;
    id: number;
    email: string;
    password_hash: string;
    created_at: Date;
    verified: boolean;
    static jsonSchema: {
        type: string;
        required: string[];
        properties: {
            id: {
                type: string;
            };
            email: {
                type: string;
                format: string;
            };
            password_hash: {
                type: string;
            };
            created_at: {
                type: string;
                format: string;
            };
            verified: {
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
    };
}
export type UserModelType = ModelObject<UserModel>;
//# sourceMappingURL=UserModel.d.ts.map