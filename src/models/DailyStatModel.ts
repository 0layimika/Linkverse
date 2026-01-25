import { Model, ModelObject } from 'objection';
import { CreatorModel } from './CreatorModel';
import { LinkModel } from './LinkModel';

export class DailyStatModel extends Model {
    static tableName = "daily_stats";

    id!: number;
    creator_id!: number;
    link_id!: number | null;
    date!: string;
    view_count!: number;
    click_count!: number;
    unique_visitors!: number;

    static get jsonSchema() {
        return {
            type: "object",
            required: ["creator_id", "date"],
            properties: {
                id: { type: "integer" },
                creator_id: { type: "integer" },
                link_id: { type: ["integer", "null"] },
                date: { type: "string", format: "date" },
                view_count: { type: "integer" },
                click_count: { type: "integer" },
                unique_visitors: { type: "integer" },
            },
        };
    }

    static get relationMappings() {
        return {
            creator: {
                relation: Model.BelongsToOneRelation,
                modelClass: CreatorModel,
                join: {
                    from: "daily_stats.creator_id",
                    to: "creators.id",
                },
            },
            link: {
                relation: Model.BelongsToOneRelation,
                modelClass: LinkModel,
                join: {
                    from: "daily_stats.link_id",
                    to: "links.id",
                },
            },
        };
    }
}

export type DailyStatModelType = ModelObject<DailyStatModel>;
