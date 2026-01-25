import { Model, ModelObject } from 'objection';
import { CreatorModel } from './CreatorModel';

export class LinkModel extends Model {
    static tableName = "links";

    id!: number;
    creator_id!: number;
    title!: string;
    url!: string;
    icon!: string | null;
    position!: number;
    is_active!: boolean;
    created_at!: string;
    updated_at!: string;

    static get jsonSchema() {
        return {
            type: "object",
            required: ["creator_id", "title", "url"],
            properties: {
                id: { type: "integer" },
                creator_id: { type: "integer" },
                title: { type: "string", minLength: 1, maxLength: 100 },
                url: { type: "string", minLength: 1 },
                icon: { type: ["string", "null"] },
                position: { type: "integer" },
                is_active: { type: "boolean" },
            },
        };
    }

    static get relationMappings() {
        return {
            creator: {
                relation: Model.BelongsToOneRelation,
                modelClass: CreatorModel,
                join: {
                    from: "links.creator_id",
                    to: "creators.id",
                },
            },
        };
    }
}

export type LinkModelType = ModelObject<LinkModel>;
