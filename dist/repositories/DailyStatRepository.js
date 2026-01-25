"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DailyStatRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
const DailyStatModel_1 = require("../models/DailyStatModel");
const objection_1 = require("objection");
class DailyStatRepositoryClass extends BaseRepository_1.BaseRepository {
    constructor() {
        super(DailyStatModel_1.DailyStatModel);
    }
    async upsertStat(creatorId, linkId, date, incrementViews = 0, incrementClicks = 0, isUniqueVisitor = false) {
        const existing = await DailyStatModel_1.DailyStatModel.query()
            .where({ creator_id: creatorId, date })
            .modify((qb) => {
            if (linkId === null) {
                qb.whereNull('link_id');
            }
            else {
                qb.where({ link_id: linkId });
            }
        })
            .first();
        if (existing) {
            return await DailyStatModel_1.DailyStatModel.query()
                .patchAndFetchById(existing.id, {
                view_count: (0, objection_1.raw)('view_count + ?', [incrementViews]),
                click_count: (0, objection_1.raw)('click_count + ?', [incrementClicks]),
                unique_visitors: isUniqueVisitor
                    ? (0, objection_1.raw)('unique_visitors + 1')
                    : (0, objection_1.raw)('unique_visitors'),
            });
        }
        return await DailyStatModel_1.DailyStatModel.query().insert({
            creator_id: creatorId,
            link_id: linkId,
            date,
            view_count: incrementViews,
            click_count: incrementClicks,
            unique_visitors: isUniqueVisitor ? 1 : 0,
        });
    }
    async getAggregatedStats(creatorId, startDate, endDate, linkId) {
        const query = DailyStatModel_1.DailyStatModel.query()
            .where({ creator_id: creatorId })
            .where('date', '>=', startDate)
            .where('date', '<=', endDate)
            .sum('view_count as total_views')
            .sum('click_count as total_clicks')
            .sum('unique_visitors as unique_visitors')
            .first();
        if (linkId !== undefined) {
            query.where({ link_id: linkId });
        }
        else {
            query.whereNull('link_id');
        }
        const result = await query;
        return {
            total_views: Number(result?.total_views) || 0,
            total_clicks: Number(result?.total_clicks) || 0,
            unique_visitors: Number(result?.unique_visitors) || 0,
        };
    }
    async getAllLinksAggregatedStats(creatorId, startDate, endDate) {
        const result = await DailyStatModel_1.DailyStatModel.query()
            .where({ creator_id: creatorId })
            .whereNotNull('link_id')
            .where('date', '>=', startDate)
            .where('date', '<=', endDate)
            .sum('click_count as total_clicks')
            .first();
        return {
            total_views: 0,
            total_clicks: Number(result?.total_clicks) || 0,
            unique_visitors: 0,
        };
    }
    async getDailyBreakdown(creatorId, startDate, endDate) {
        const results = await DailyStatModel_1.DailyStatModel.query()
            .where({ creator_id: creatorId })
            .whereNull('link_id')
            .where('date', '>=', startDate)
            .where('date', '<=', endDate)
            .select('date')
            .sum('view_count as views')
            .sum('click_count as clicks')
            .groupBy('date')
            .orderBy('date', 'asc');
        return results.map((r) => ({
            date: r.date,
            views: Number(r.views) || 0,
            clicks: Number(r.clicks) || 0,
        }));
    }
    async getTopLinks(creatorId, startDate, endDate, limit = 5) {
        const results = await DailyStatModel_1.DailyStatModel.query()
            .where({ creator_id: creatorId })
            .whereNotNull('link_id')
            .where('date', '>=', startDate)
            .where('date', '<=', endDate)
            .select('link_id')
            .sum('click_count as clicks')
            .groupBy('link_id')
            .orderBy('clicks', 'desc')
            .limit(limit);
        return results.map((r) => ({
            link_id: r.link_id,
            clicks: Number(r.clicks) || 0,
        }));
    }
    async getLinkDailyBreakdown(creatorId, linkId, startDate, endDate) {
        const results = await DailyStatModel_1.DailyStatModel.query()
            .where({ creator_id: creatorId, link_id: linkId })
            .where('date', '>=', startDate)
            .where('date', '<=', endDate)
            .select('date')
            .sum('click_count as clicks')
            .groupBy('date')
            .orderBy('date', 'asc');
        return results.map((r) => ({
            date: r.date,
            views: 0,
            clicks: Number(r.clicks) || 0,
        }));
    }
}
exports.DailyStatRepository = new DailyStatRepositoryClass();
//# sourceMappingURL=DailyStatRepository.js.map