import { BaseRepository } from "./BaseRepository";
import { ServiceAvailabilityWindowModel } from "../models/ServiceAvailabilityWindowModel";

export interface ServiceAvailabilityRecord {
    id: number;
    creator_id: number;
    weekday: number;
    start_time: string;
    end_time: string;
    timezone: string;
    created_at: string;
    updated_at: string;
}

class ServiceAvailabilityRepositoryClass extends BaseRepository<ServiceAvailabilityRecord, ServiceAvailabilityWindowModel> {
    constructor() {
        super(ServiceAvailabilityWindowModel);
    }

    async getByCreatorId(creatorId: number): Promise<ServiceAvailabilityRecord[]> {
        return await ServiceAvailabilityWindowModel.query()
            .where({ creator_id: creatorId })
            .orderBy("weekday", "asc")
            .orderBy("start_time", "asc");
    }
}

export const ServiceAvailabilityRepository = new ServiceAvailabilityRepositoryClass();
