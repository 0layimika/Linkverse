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

class ClickEventRepositoryClass extends BaseRepository<ClickEvent, ClickEventModel> {
    constructor() {
        super(ClickEventModel);
    }

    async hasRecentEvent(
        creatorId: number,
        ipHash: string,
        eventType: string,
        linkId: number | null,
        windowMinutes: number = 30
    ): Promise<boolean> {
        const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();

        const query = ClickEventModel.query()
            .where({ creator_id: creatorId, ip_hash: ipHash, event_type: eventType })
            .where('created_at', '>=', windowStart);

        if (linkId !== null) {
            query.where({ link_id: linkId });
        } else {
            query.whereNull('link_id');
        }

        const result = await query.first();
        return !!result;
    }

    async getEventsInRange(
        creatorId: number,
        startDate: string,
        endDate: string,
        eventType?: string
    ): Promise<ClickEvent[]> {
        const query = ClickEventModel.query()
            .where({ creator_id: creatorId })
            .where('created_at', '>=', startDate)
            .where('created_at', '<=', endDate);

        if (eventType) {
            query.where({ event_type: eventType });
        }

        return await query.orderBy('created_at', 'desc');
    }
}

export const ClickEventRepository = new ClickEventRepositoryClass();
