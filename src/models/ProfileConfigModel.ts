import { Model, ModelObject } from 'objection';
import { CreatorModel } from './CreatorModel';

export class ProfileConfigModel extends Model {
    static tableName = "profile_config";

    id!: number;
    creator_id!: number;
    background_type!: string;
    background_value!: string | null;
    text_color!: string | null;
    support_button_text!: string | null;
    created_at!: string;
    updated_at!: string;

    static get jsonSchema() {
        return {
            type: "object",
            required: ["creator_id", "background_type"],
            properties: {
                id: { type: "integer" },
                creator_id: { type: "integer" },
                background_type: { type: "string", enum: ["color", "image"] },
                background_value: { type: ["string", "null"] },
                text_color: { type: ["string", "null"] },
            },
        };
    }

    static get relationMappings() {
        return {
            creator: {
                relation: Model.BelongsToOneRelation,
                modelClass: CreatorModel,
                join: {
                    from: "profile_config.creator_id",
                    to: "creators.id",
                },
            },
        };
    }
}

export type ProfileConfigModelType = ModelObject<ProfileConfigModel>;
