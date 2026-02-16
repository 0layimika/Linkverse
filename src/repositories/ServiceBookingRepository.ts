import { BaseRepository } from "./BaseRepository";
import { ServiceBookingModel } from "../models/ServiceBookingModel";
import { ServiceBookingStatus } from "../types/store.types";

export interface ServiceBookingRecord {
    id: number;
    service_id: number;
    creator_id: number;
    order_id: number | null;
    slot_start: string;
    slot_end: string;
    status: ServiceBookingStatus;
    hold_expires_at: string | null;
    buyer_email: string | null;
    buyer_name: string | null;
    buyer_phone: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

class ServiceBookingRepositoryClass extends BaseRepository<ServiceBookingRecord, ServiceBookingModel> {
    constructor() {
        super(ServiceBookingModel);
    }

    async getByCreatorId(creatorId: number, limit = 20, offset = 0): Promise<ServiceBookingRecord[]> {
        return await ServiceBookingModel.query()
            .where({ creator_id: creatorId })
            .orderBy("created_at", "desc")
            .limit(limit)
            .offset(offset);
    }

    async expireHolds(): Promise<number> {
        const result = await ServiceBookingModel.query()
            .where("status", "hold")
            .where("hold_expires_at", "<", new Date().toISOString())
            .patch({ status: "expired" });
        return result;
    }
}

export const ServiceBookingRepository = new ServiceBookingRepositoryClass();
