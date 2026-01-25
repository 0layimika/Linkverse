import { BaseRepository } from "./BaseRepository";
import { DailyStatModel } from "../models/DailyStatModel";
import { raw } from "objection";

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

class DailyStatRepositoryClass extends BaseRepository<DailyStat, DailyStatModel> {
    constructor() {
        super(DailyStatModel);
    }

    async upsertStat(
        creatorId: number,
        linkId: number | null,
        date: string,
        incrementViews: number = 0,
        incrementClicks: number = 0,
        isUniqueVisitor: boolean = false
    ): Promise<DailyStat> {
        const existing = await DailyStatModel.query()
            .where({ creator_id: creatorId, date })
            .modify((qb) => {
                if (linkId === null) {
                    qb.whereNull('link_id');
                } else {
                    qb.where({ link_id: linkId });
                }
            })
            .first();

        if (existing) {
            return await DailyStatModel.query()
                .patchAndFetchById(existing.id, {
                    view_count: raw('view_count + ?', [incrementViews]),
                    click_count: raw('click_count + ?', [incrementClicks]),
                    unique_visitors: isUniqueVisitor
                        ? raw('unique_visitors + 1')
                        : raw('unique_visitors'),
                });
        }

        return await DailyStatModel.query().insert({
            creator_id: creatorId,
            link_id: linkId,
            date,
            view_count: incrementViews,
            click_count: incrementClicks,
            unique_visitors: isUniqueVisitor ? 1 : 0,
        });
    }

    async getAggregatedStats(
        creatorId: number,
        startDate: string,
        endDate: string,
        linkId?: number
    ): Promise<AggregatedStats> {
        const query = DailyStatModel.query()
            .where({ creator_id: creatorId })
            .where('date', '>=', startDate)
            .where('date', '<=', endDate)
            .sum('view_count as total_views')
            .sum('click_count as total_clicks')
            .sum('unique_visitors as unique_visitors')
            .first();

        if (linkId !== undefined) {
            query.where({ link_id: linkId });
        } else {
            query.whereNull('link_id');
        }

        const result = await query as any;

        return {
            total_views: Number(result?.total_views) || 0,
            total_clicks: Number(result?.total_clicks) || 0,
            unique_visitors: Number(result?.unique_visitors) || 0,
        };
    }

    async getAllLinksAggregatedStats(
        creatorId: number,
        startDate: string,
        endDate: string
    ): Promise<AggregatedStats> {
        const result = await DailyStatModel.query()
            .where({ creator_id: creatorId })
            .whereNotNull('link_id')
            .where('date', '>=', startDate)
            .where('date', '<=', endDate)
            .sum('click_count as total_clicks')
            .first() as any;

        return {
            total_views: 0,
            total_clicks: Number(result?.total_clicks) || 0,
            unique_visitors: 0,
        };
    }

    async getDailyBreakdown(
        creatorId: number,
        startDate: string,
        endDate: string
    ): Promise<DailyBreakdown[]> {
        const results = await DailyStatModel.query()
            .where({ creator_id: creatorId })
            .whereNull('link_id')
            .where('date', '>=', startDate)
            .where('date', '<=', endDate)
            .select('date')
            .sum('view_count as views')
            .sum('click_count as clicks')
            .groupBy('date')
            .orderBy('date', 'asc') as any[];

        return results.map((r) => ({
            date: r.date,
            views: Number(r.views) || 0,
            clicks: Number(r.clicks) || 0,
        }));
    }

    async getTopLinks(
        creatorId: number,
        startDate: string,
        endDate: string,
        limit: number = 5
    ): Promise<LinkStats[]> {
        const results = await DailyStatModel.query()
            .where({ creator_id: creatorId })
            .whereNotNull('link_id')
            .where('date', '>=', startDate)
            .where('date', '<=', endDate)
            .select('link_id')
            .sum('click_count as clicks')
            .groupBy('link_id')
            .orderBy('clicks', 'desc')
            .limit(limit) as any[];

        return results.map((r) => ({
            link_id: r.link_id,
            clicks: Number(r.clicks) || 0,
        }));
    }

    async getLinkDailyBreakdown(
        creatorId: number,
        linkId: number,
        startDate: string,
        endDate: string
    ): Promise<DailyBreakdown[]> {
        const results = await DailyStatModel.query()
            .where({ creator_id: creatorId, link_id: linkId })
            .where('date', '>=', startDate)
            .where('date', '<=', endDate)
            .select('date')
            .sum('click_count as clicks')
            .groupBy('date')
            .orderBy('date', 'asc') as any[];

        return results.map((r) => ({
            date: r.date,
            views: 0,
            clicks: Number(r.clicks) || 0,
        }));
    }
}

export const DailyStatRepository = new DailyStatRepositoryClass();
