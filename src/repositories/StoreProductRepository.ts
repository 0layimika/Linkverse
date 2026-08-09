import { BaseRepository } from "./BaseRepository";
import { StoreProductModel } from "../models/StoreProductModel";
import { StoreProductType } from "../types/store.types";
import { Transaction } from "objection";

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
    track_inventory: boolean;
    stock_quantity: number | null;
    deleted_at: string | null;
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
            .whereNull("deleted_at")
            .orderBy("created_at", "desc")
            .limit(limit)
            .offset(offset);
    }

    async getActiveByCreatorId(creatorId: number, limit = 50, offset = 0): Promise<StoreProductRecord[]> {
        return await StoreProductModel.query()
            .where({ creator_id: creatorId, is_active: true })
            .whereNull("deleted_at")
            .where((qb) => {
                qb.whereNot({ type: "physical" })
                    .orWhere({ track_inventory: false })
                    .orWhere("stock_quantity", ">", 0);
            })
            .orderBy("created_at", "desc")
            .limit(limit)
            .offset(offset);
    }

    async getActivePhysicalByCreatorId(creatorId: number, limit = 20, offset = 0): Promise<StoreProductRecord[]> {
        return await StoreProductModel.query()
            .where({ creator_id: creatorId, is_active: true, type: "physical" })
            .whereNull("deleted_at")
            .where((qb) => qb.where({ track_inventory: false }).orWhere("stock_quantity", ">", 0))
            .orderBy("created_at", "desc")
            .limit(limit)
            .offset(offset);
    }

    async findVisibleById(id: number | string, transaction?: Transaction): Promise<StoreProductRecord | undefined> {
        return await StoreProductModel.query(transaction)
            .findById(id)
            .whereNull("deleted_at");
    }
}

export const StoreProductRepository = new StoreProductRepositoryClass();
