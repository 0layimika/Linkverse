import { BaseRepository } from "./BaseRepository";
import { DailyStatModel } from "../models/DailyStatModel";
export interface DailyStat {
    id: number;
    creator_id: number;
    link_id: number | null;
    date: string;
    view_count: number;
    click_count: number;
    unique_visitors: number;
}
export interface AggregatedStats {
    total_views: number;
    total_clicks: number;
    unique_visitors: number;
}
export interface DailyBreakdown {
    date: string;
    views: number;
    clicks: number;
}
export interface LinkStats {
    link_id: number;
    clicks: number;
}
declare class DailyStatRepositoryClass extends BaseRepository<DailyStat, DailyStatModel> {
    constructor();
    upsertStat(creatorId: number, linkId: number | null, date: string, incrementViews?: number, incrementClicks?: number, isUniqueVisitor?: boolean): Promise<DailyStat>;
    getAggregatedStats(creatorId: number, startDate: string, endDate: string, linkId?: number): Promise<AggregatedStats>;
    getAllLinksAggregatedStats(creatorId: number, startDate: string, endDate: string): Promise<AggregatedStats>;
    getDailyBreakdown(creatorId: number, startDate: string, endDate: string): Promise<DailyBreakdown[]>;
    getTopLinks(creatorId: number, startDate: string, endDate: string, limit?: number): Promise<LinkStats[]>;
    getLinkDailyBreakdown(creatorId: number, linkId: number, startDate: string, endDate: string): Promise<DailyBreakdown[]>;
}
export declare const DailyStatRepository: DailyStatRepositoryClass;
export {};
//# sourceMappingURL=DailyStatRepository.d.ts.map