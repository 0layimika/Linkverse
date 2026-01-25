import { Model, ModelObject } from 'objection';
import { CreatorModel } from './CreatorModel';
import { LinkModel } from './LinkModel';
export declare class DailyStatModel extends Model {
    static tableName: string;
    id: number;
    creator_id: number;
    link_id: number | null;
    date: string;
    view_count: number;
    click_count: number;
    unique_visitors: number;
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
            date: {
                type: string;
                format: string;
            };
            view_count: {
                type: string;
            };
            click_count: {
                type: string;
            };
            unique_visitors: {
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
export type DailyStatModelType = ModelObject<DailyStatModel>;
//# sourceMappingURL=DailyStatModel.d.ts.map