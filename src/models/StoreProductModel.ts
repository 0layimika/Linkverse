import { Model, ModelObject } from "objection";
import { StoreProductType } from "../types/store.types";
import { CreatorModel } from "./CreatorModel";

export class StoreProductModel extends Model {
    static tableName = "store_products";

    id!: number;
    creator_id!: number;
    type!: StoreProductType;
    title!: string;
    description!: string | null;
    price!: number;
    currency!: string;
    cover_url!: string | null;
    is_active!: boolean;
    download_limit!: number;
    file_id!: string | null;
    file_url!: string | null;
    file_size!: number | null;
    file_type!: string | null;
    duration_minutes!: number | null;
    buffer_minutes!: number | null;
    timezone!: string | null;
    requires_address!: boolean;
    track_inventory!: boolean;
    stock_quantity!: number | null;
    deleted_at!: string | null;
    created_at!: string;
    updated_at!: string;

    static get relationMappings() {
        return {
            creator: {
                relation: Model.BelongsToOneRelation,
                modelClass: CreatorModel,
                join: {
                    from: "store_products.creator_id",
                    to: "creators.id",
                },
            },
        };
    }
}

export type StoreProductModelType = ModelObject<StoreProductModel>;
