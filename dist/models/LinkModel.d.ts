import { Model, ModelObject } from 'objection';
import { CreatorModel } from './CreatorModel';
export declare class LinkModel extends Model {
    static tableName: string;
    id: number;
    creator_id: number;
    title: string;
    url: string;
    icon: string | null;
    position: number;
    is_active: boolean;
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
            title: {
                type: string;
                minLength: number;
                maxLength: number;
            };
            url: {
                type: string;
                minLength: number;
            };
            icon: {
                type: string[];
            };
            position: {
                type: string;
            };
            is_active: {
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
export type LinkModelType = ModelObject<LinkModel>;
//# sourceMappingURL=LinkModel.d.ts.map