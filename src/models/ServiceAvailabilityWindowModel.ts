import { Model, ModelObject } from "objection";
import { CreatorModel } from "./CreatorModel";

export class ServiceAvailabilityWindowModel extends Model {
    static tableName = "service_availability_windows";

    id!: number;
    creator_id!: number;
    weekday!: number;
    start_time!: string;
    end_time!: string;
    timezone!: string;
    created_at!: string;
    updated_at!: string;

    static get relationMappings() {
        return {
            creator: {
                relation: Model.BelongsToOneRelation,
                modelClass: CreatorModel,
                join: {
                    from: "service_availability_windows.creator_id",
                    to: "creators.id",
                },
            },
        };
    }
}

export type ServiceAvailabilityWindowModelType = ModelObject<ServiceAvailabilityWindowModel>;
