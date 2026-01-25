import { Model, ModelObject } from 'objection';
import { CreatorModel } from './CreatorModel';
import { LinkModel } from './LinkModel';

export class ClickEventModel extends Model {
    static tableName = "click_events";

    id!: number;
    creator_id!: number;
    link_id!: number | null;
    event_type!: string;
    ip_hash!: string;
    user_agent!: string | null;
    referrer!: string | null;
    created_at!: string;

    static get jsonSchema() {
        return {
            type: "object",
            required: ["creator_id", "event_type", "ip_hash"],
            properties: {
                id: { type: "integer" },
                creator_id: { type: "integer" },
                link_id: { type: ["integer", "null"] },
                event_type: { type: "string", maxLength: 20 },
                ip_hash: { type: "string", maxLength: 64 },
                user_agent: { type: ["string", "null"] },
                referrer: { type: ["string", "null"] },
            },
        };
    }

    static get relationMappings() {
        return {
            creator: {
                relation: Model.BelongsToOneRelation,
                modelClass: CreatorModel,
                join: {
                    from: "click_events.creator_id",
                    to: "creators.id",
                },
            },
            link: {
                relation: Model.BelongsToOneRelation,
                modelClass: LinkModel,
                join: {
                    from: "click_events.link_id",
                    to: "links.id",
                },
            },
        };
    }
}

export type ClickEventModelType = ModelObject<ClickEventModel>;
