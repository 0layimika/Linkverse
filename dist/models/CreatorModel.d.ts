import { Model, ModelObject } from 'objection';
import { UserModel } from "./UserModel";
export declare class CreatorModel extends Model {
    static tableName: string;
    id: number;
    username: string;
    user_id: number;
    created_at: string;
    updated_at: string;
    avatar_url: string;
    first_name: string;
    last_name: string;
    bio: string;
    static get jsonSchema(): {
        type: string;
        required: string[];
        properties: {
            id: {
                type: string;
            };
            username: {
                type: string;
                minLength: number;
                maxLength: number;
            };
            user_id: {
                type: string;
            };
            avatar_url: {
                type: string;
            };
        };
    };
    static get relationMappings(): {
        user: {
            relation: import("objection").RelationType;
            modelClass: typeof UserModel;
            join: {
                from: string;
                to: string;
            };
        };
        links: {
            relation: import("objection").RelationType;
            modelClass: () => any;
            join: {
                from: string;
                to: string;
            };
        };
        wallet: {
            relation: import("objection").RelationType;
            modelClass: () => any;
            join: {
                from: string;
                to: string;
            };
        };
        bankAccount: {
            relation: import("objection").RelationType;
            modelClass: () => any;
            join: {
                from: string;
                to: string;
            };
        };
    };
}
export type CreatorModelType = ModelObject<CreatorModel>;
//# sourceMappingURL=CreatorModel.d.ts.map