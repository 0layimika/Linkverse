import { Model, ModelObject } from "objection";
import { StoreOrderStatus } from "../types/store.types";
import { StoreProductModel } from "./StoreProductModel";
import { CreatorModel } from "./CreatorModel";
import { StoreOrderItemModel } from "./StoreOrderItemModel";

export class StoreOrderModel extends Model {
    static tableName = "store_orders";

    id!: number;
    creator_id!: number;
    product_id!: number;
    buyer_email!: string;
    buyer_name!: string | null;
    buyer_phone!: string | null;
    delivery_address!: Record<string, any> | null;
    status!: StoreOrderStatus;
    amount!: number;
    amount_minor!: number | null;
    subtotal!: number;
    total!: number;
    item_count!: number;
    platform_fee!: number;
    platform_fee_minor!: number;
    currency!: string;
    reference!: string;
    provider!: string;
    provider_reference!: string | null;
    metadata!: Record<string, any> | null;
    created_at!: string;
    updated_at!: string;

    static get relationMappings() {
        return {
            product: {
                relation: Model.BelongsToOneRelation,
                modelClass: StoreProductModel,
                join: {
                    from: "store_orders.product_id",
                    to: "store_products.id",
                },
            },
            creator: {
                relation: Model.BelongsToOneRelation,
                modelClass: CreatorModel,
                join: {
                    from: "store_orders.creator_id",
                    to: "creators.id",
                },
            },
            items: {
                relation: Model.HasManyRelation,
                modelClass: StoreOrderItemModel,
                join: {
                    from: "store_orders.id",
                    to: "store_order_items.order_id",
                },
            },
        };
    }
}

export type StoreOrderModelType = ModelObject<StoreOrderModel>;
