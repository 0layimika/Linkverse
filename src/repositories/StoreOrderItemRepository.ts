import { BaseRepository } from "./BaseRepository";
import { StoreOrderItemModel } from "../models/StoreOrderItemModel";

export interface StoreOrderItemRecord {
    id: number;
    order_id: number;
    product_id: number;
    title_snapshot: string;
    type_snapshot: "digital" | "physical" | "service";
    unit_price: number;
    quantity: number;
    line_total: number;
    currency: string;
    metadata: Record<string, any> | null;
    created_at: string;
    updated_at: string;
}

class StoreOrderItemRepositoryClass extends BaseRepository<StoreOrderItemRecord, StoreOrderItemModel> {
    constructor() {
        super(StoreOrderItemModel);
    }

    async getByOrderId(orderId: number): Promise<StoreOrderItemRecord[]> {
        return await StoreOrderItemModel.query().where({ order_id: orderId }).orderBy("id", "asc");
    }
}

export const StoreOrderItemRepository = new StoreOrderItemRepositoryClass();
