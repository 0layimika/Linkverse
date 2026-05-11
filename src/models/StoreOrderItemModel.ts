import { Model, ModelObject } from "objection";
import { StoreProductType } from "../types/store.types";
import { StoreOrderModel } from "./StoreOrderModel";
import { StoreProductModel } from "./StoreProductModel";

export class StoreOrderItemModel extends Model {
    static tableName = "store_order_items";

    id!: number;
    order_id!: number;
    product_id!: number;
    title_snapshot!: string;
    type_snapshot!: StoreProductType;
    unit_price!: number;
    quantity!: number;
    line_total!: number;
    currency!: string;
    metadata!: Record<string, any> | null;
    created_at!: string;
    updated_at!: string;

    static get relationMappings() {
        return {
            order: {
                relation: Model.BelongsToOneRelation,
                modelClass: StoreOrderModel,
                join: {
                    from: "store_order_items.order_id",
                    to: "store_orders.id",
                },
            },
            product: {
                relation: Model.BelongsToOneRelation,
                modelClass: StoreProductModel,
                join: {
                    from: "store_order_items.product_id",
                    to: "store_products.id",
                },
            },
        };
    }
}

export type StoreOrderItemModelType = ModelObject<StoreOrderItemModel>;
