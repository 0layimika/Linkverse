import { Model, ModelObject } from 'objection';
import { CreatorModel } from './CreatorModel';
import { LinkModel } from './LinkModel';
export declare class ClickEventModel extends Model {
    static tableName: string;
    id: number;
    creator_id: number;
    link_id: number | null;
    event_type: string;
    ip_hash: string;
    user_agent: string | null;
    referrer: string | null;
    created_at: string;
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
            link_id: {
                type: string[];
            };
            event_type: {
                type: string;
                maxLength: number;
            };
            ip_hash: {
                type: string;
                maxLength: number;
            };
            user_agent: {
                type: string[];
            };
            referrer: {
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
        link: {
            relation: import("objection").RelationType;
            modelClass: typeof LinkModel;
            join: {
                from: string;
                to: string;
            };
        };
    };
}
export type ClickEventModelType = ModelObject<ClickEventModel>;
//# sourceMappingURL=ClickEventModel.d.ts.map