import { BaseRepository } from "./BaseRepository";
import { StoreProductModel } from "../models/StoreProductModel";
import { StoreProductType } from "../types/store.types";

export interface StoreProductRecord {
    id: number;
    creator_id: number;
    type: StoreProductType;
    title: string;
    description: string | null;
    price: number;
    currency: string;
    cover_url: string | null;
    is_active: boolean;
    download_limit: number;
    file_id: string | null;
    file_url: string | null;
    file_size: number | null;
    file_type: string | null;
    duration_minutes: number | null;
    buffer_minutes: number | null;
    timezone: string | null;
    requires_address: boolean;
    created_at: string;
    updated_at: string;
}

class StoreProductRepositoryClass extends BaseRepository<StoreProductRecord, StoreProductModel> {
    constructor() {
        super(StoreProductModel);
    }

    async getByCreatorId(creatorId: number, limit = 20, offset = 0): Promise<StoreProductRecord[]> {
        return await StoreProductModel.query()
            .where({ creator_id: creatorId })
            .orderBy("created_at", "desc")
            .limit(limit)
            .offset(offset);
    }

    async getActiveByCreatorId(creatorId: number, limit = 50, offset = 0): Promise<StoreProductRecord[]> {
        return await StoreProductModel.query()
            .where({ creator_id: creatorId, is_active: true })
            .orderBy("created_at", "desc")
            .limit(limit)
            .offset(offset);
    }
}

export const StoreProductRepository = new StoreProductRepositoryClass();
