import { BaseRepository } from "./BaseRepository";
import { StoreOrderModel } from "../models/StoreOrderModel";
import { StoreOrderStatus } from "../types/store.types";

export interface StoreOrderRecord {
    id: number;
    creator_id: number;
    product_id: number;
    buyer_email: string;
    buyer_name: string | null;
    buyer_phone: string | null;
    delivery_address: Record<string, any> | null;
    status: StoreOrderStatus;
    amount: number;
    amount_minor: number | null;
    subtotal: number;
    total: number;
    item_count: number;
    platform_fee: number;
    platform_fee_minor: number;
    currency: string;
    reference: string;
    provider: string;
    provider_reference: string | null;
    metadata: Record<string, any> | null;
    created_at: string;
    updated_at: string;
}

class StoreOrderRepositoryClass extends BaseRepository<StoreOrderRecord, StoreOrderModel> {
    constructor() {
        super(StoreOrderModel);
    }

    async getByReference(reference: string): Promise<StoreOrderRecord | undefined> {
        return await StoreOrderModel.query().findOne({ reference });
    }

    async getByReferenceWithProduct(reference: string): Promise<any> {
        return await StoreOrderModel.query()
            .findOne({ reference })
            .withGraphFetched('[product, items]');
    }

    async updateStatus(id: number, status: StoreOrderStatus, providerReference?: string): Promise<StoreOrderRecord> {
        const updateData: any = { status };
        if (providerReference) {
            updateData.provider_reference = providerReference;
        }
        return await StoreOrderModel.query().patchAndFetchById(id, updateData);
    }

    async getByCreatorId(creatorId: number, limit = 20, offset = 0): Promise<StoreOrderRecord[]> {
        return await StoreOrderModel.query()
            .where({ creator_id: creatorId })
            .orderBy("created_at", "desc")
            .limit(limit)
            .offset(offset);
    }

    async getByCreatorIdWithProduct(creatorId: number, limit = 20, offset = 0): Promise<any[]> {
        return await StoreOrderModel.query()
            .where({ creator_id: creatorId })
            .withGraphFetched('[product, items]')
            .orderBy("created_at", "desc")
            .limit(limit)
            .offset(offset);
    }
}

export const StoreOrderRepository = new StoreOrderRepositoryClass();
