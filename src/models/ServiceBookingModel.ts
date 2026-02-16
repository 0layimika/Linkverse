import { Model, ModelObject } from "objection";
import { ServiceBookingStatus } from "../types/store.types";
import { CreatorModel } from "./CreatorModel";
import { StoreProductModel } from "./StoreProductModel";
import { StoreOrderModel } from "./StoreOrderModel";

export class ServiceBookingModel extends Model {
    static tableName = "service_bookings";

    id!: number;
    service_id!: number;
    creator_id!: number;
    order_id!: number | null;
    slot_start!: string;
    slot_end!: string;
    status!: ServiceBookingStatus;
    hold_expires_at!: string | null;
    buyer_email!: string | null;
    buyer_name!: string | null;
    buyer_phone!: string | null;
    notes!: string | null;
    created_at!: string;
    updated_at!: string;

    static get relationMappings() {
        return {
            creator: {
                relation: Model.BelongsToOneRelation,
                modelClass: CreatorModel,
                join: {
                    from: "service_bookings.creator_id",
                    to: "creators.id",
                },
            },
            service: {
                relation: Model.BelongsToOneRelation,
                modelClass: StoreProductModel,
                join: {
                    from: "service_bookings.service_id",
                    to: "store_products.id",
                },
            },
            order: {
                relation: Model.BelongsToOneRelation,
                modelClass: StoreOrderModel,
                join: {
                    from: "service_bookings.order_id",
                    to: "store_orders.id",
                },
            },
        };
    }
}

export type ServiceBookingModelType = ModelObject<ServiceBookingModel>;
