import { Model, ModelObject } from "objection";
import { CreatorModel } from "./CreatorModel";
import { SOCIAL_PLATFORMS } from "../utils/social-links";

export class CreatorSocialLinkModel extends Model {
    static tableName = "creator_social_links";

    id!: number;
    creator_id!: number;
    platform!: (typeof SOCIAL_PLATFORMS)[number];
    url!: string;
    position!: number;
    is_visible!: boolean;
    created_at!: string;
    updated_at!: string;

    static get jsonSchema() {
        return {
            type: "object",
            required: ["creator_id", "platform", "url", "position", "is_visible"],
            properties: {
                id: { type: "integer" },
                creator_id: { type: "integer" },
                platform: { type: "string", enum: [...SOCIAL_PLATFORMS] },
                url: { type: "string", minLength: 1, maxLength: 2048 },
                position: { type: "integer", minimum: 0 },
                is_visible: { type: "boolean" },
            },
        };
    }

    static get relationMappings() {
        return {
            creator: {
                relation: Model.BelongsToOneRelation,
                modelClass: CreatorModel,
                join: {
                    from: "creator_social_links.creator_id",
                    to: "creators.id",
                },
            },
        };
    }
}

export type CreatorSocialLinkModelType = ModelObject<CreatorSocialLinkModel>;
