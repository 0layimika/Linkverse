import { Model, ModelObject } from "objection";
import { StoreOrderModel } from "./StoreOrderModel";

export class StoreDownloadTokenModel extends Model {
    static tableName = "store_download_tokens";

    id!: number;
    order_id!: number;
    token!: string;
    max_downloads!: number;
    download_count!: number;
    last_download_at!: string | null;
    revoked_at!: string | null;
    created_at!: string;
    updated_at!: string;

    static get relationMappings() {
        return {
            order: {
                relation: Model.BelongsToOneRelation,
                modelClass: StoreOrderModel,
                join: {
                    from: "store_download_tokens.order_id",
                    to: "store_orders.id",
                },
            },
        };
    }
}

export type StoreDownloadTokenModelType = ModelObject<StoreDownloadTokenModel>;
