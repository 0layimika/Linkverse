import { BaseRepository } from "./BaseRepository";
import { ClickEventModel } from "../models/ClickEventModel";
export interface ClickEvent {
    id: number;
    creator_id: number;
    link_id: number | null;
    event_type: string;
    ip_hash: string;
    user_agent: string | null;
    referrer: string | null;
    created_at: string;
}
declare class ClickEventRepositoryClass extends BaseRepository<ClickEvent, ClickEventModel> {
    constructor();
    hasRecentEvent(creatorId: number, ipHash: string, eventType: string, linkId: number | null, windowMinutes?: number): Promise<boolean>;
    getEventsInRange(creatorId: number, startDate: string, endDate: string, eventType?: string): Promise<ClickEvent[]>;
}
export declare const ClickEventRepository: ClickEventRepositoryClass;
export {};
//# sourceMappingURL=ClickEventRepository.d.ts.map