"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const crypto_1 = require("crypto");
const ClickEventRepository_1 = require("../repositories/ClickEventRepository");
const DailyStatRepository_1 = require("../repositories/DailyStatRepository");
const CreatorRepository_1 = require("../repositories/CreatorRepository");
const LinkRepository_1 = require("../repositories/LinkRepository");
const api_response_kit_1 = require("@0layimika/api-response-kit");
class AnalyticsService {
    static hashIp(ip) {
        return (0, crypto_1.createHash)("sha256").update(ip).digest("hex");
    }
    static getDateRange(period) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        let start;
        const end = new Date(today);
        end.setDate(end.getDate() + 1);
        switch (period) {
            case "today":
                start = today;
                break;
            case "this_week":
                start = new Date(today);
                start.setDate(start.getDate() - start.getDay());
                break;
            case "this_month":
                start = new Date(today.getFullYear(), today.getMonth(), 1);
                break;
            case "all_time":
                start = new Date(2020, 0, 1);
                break;
            default:
                start = new Date(today);
                start.setDate(start.getDate() - start.getDay());
        }
        return {
            start: start.toISOString().split("T")[0],
            end: end.toISOString().split("T")[0],
        };
    }
    static getPreviousPeriodRange(_period, currentRange) {
        const currentStart = new Date(currentRange.start);
        const currentEnd = new Date(currentRange.end);
        const durationMs = currentEnd.getTime() - currentStart.getTime();
        const previousEnd = new Date(currentStart);
        const previousStart = new Date(previousEnd.getTime() - durationMs);
        return {
            start: previousStart.toISOString().split("T")[0],
            end: previousEnd.toISOString().split("T")[0],
        };
    }
    static calculatePercentageChange(current, previous) {
        if (previous === 0) {
            return current > 0 ? 100 : 0;
        }
        return Math.round(((current - previous) / previous) * 100);
    }
    static async trackProfileView(username, data) {
        try {
            const creator = await CreatorRepository_1.CreatorRepository.getOneWhere({ username });
            if (!creator) {
                return (0, api_response_kit_1.NotFound)("Creator not found");
            }
            const ipHash = this.hashIp(data.ip);
            const today = new Date().toISOString().split("T")[0];
            const hasRecent = await ClickEventRepository_1.ClickEventRepository.hasRecentEvent(creator.id, ipHash, "profile_view", null, 30);
            await ClickEventRepository_1.ClickEventRepository.create({
                creator_id: creator.id,
                link_id: null,
                event_type: "profile_view",
                ip_hash: ipHash,
                user_agent: data.userAgent || null,
                referrer: data.referrer || null,
            });
            await DailyStatRepository_1.DailyStatRepository.upsertStat(creator.id, null, today, 1, 0, !hasRecent);
            return (0, api_response_kit_1.Ok)(null, "Profile view tracked");
        }
        catch (err) {
            return (0, api_response_kit_1.InternalError)(err.message);
        }
    }
    static async trackLinkClick(linkId, data) {
        try {
            const link = await LinkRepository_1.LinkRepository.findById(linkId);
            if (!link) {
                return (0, api_response_kit_1.NotFound)("Link not found");
            }
            const ipHash = this.hashIp(data.ip);
            const today = new Date().toISOString().split("T")[0];
            const hasRecent = await ClickEventRepository_1.ClickEventRepository.hasRecentEvent(link.creator_id, ipHash, "link_click", linkId, 30);
            await ClickEventRepository_1.ClickEventRepository.create({
                creator_id: link.creator_id,
                link_id: linkId,
                event_type: "link_click",
                ip_hash: ipHash,
                user_agent: data.userAgent || null,
                referrer: data.referrer || null,
            });
            await DailyStatRepository_1.DailyStatRepository.upsertStat(link.creator_id, linkId, today, 0, 1, !hasRecent);
            return (0, api_response_kit_1.Ok)({ url: link.url }, "Link click tracked");
        }
        catch (err) {
            return (0, api_response_kit_1.InternalError)(err.message);
        }
    }
    static async getOverview(userId, period = "this_week") {
        try {
            const creator = await CreatorRepository_1.CreatorRepository.getOneWhere({ user_id: userId });
            if (!creator) {
                return (0, api_response_kit_1.NotFound)("Creator profile not found");
            }
            const dateRange = this.getDateRange(period);
            const previousRange = this.getPreviousPeriodRange(period, dateRange);
            const [currentStats, previousStats, currentLinkStats, previousLinkStats] = await Promise.all([
                DailyStatRepository_1.DailyStatRepository.getAggregatedStats(creator.id, dateRange.start, dateRange.end),
                DailyStatRepository_1.DailyStatRepository.getAggregatedStats(creator.id, previousRange.start, previousRange.end),
                DailyStatRepository_1.DailyStatRepository.getAllLinksAggregatedStats(creator.id, dateRange.start, dateRange.end),
                DailyStatRepository_1.DailyStatRepository.getAllLinksAggregatedStats(creator.id, previousRange.start, previousRange.end),
            ]);
            const topLinksStats = await DailyStatRepository_1.DailyStatRepository.getTopLinks(creator.id, dateRange.start, dateRange.end, 5);
            const linkIds = topLinksStats.map((l) => l.link_id);
            const links = await Promise.all(linkIds.map((id) => LinkRepository_1.LinkRepository.findById(id)));
            const topLinks = topLinksStats.map((stat) => {
                const link = links.find((l) => l?.id === stat.link_id);
                return {
                    link_id: stat.link_id,
                    title: link?.title || "Unknown",
                    url: link?.url || "",
                    clicks: stat.clicks,
                };
            });
            const dailyBreakdown = await DailyStatRepository_1.DailyStatRepository.getDailyBreakdown(creator.id, dateRange.start, dateRange.end);
            return (0, api_response_kit_1.Ok)({
                period,
                date_range: { start: dateRange.start, end: dateRange.end },
                summary: {
                    total_profile_views: currentStats.total_views,
                    total_link_clicks: currentLinkStats.total_clicks,
                    unique_visitors: currentStats.unique_visitors,
                    profile_views_change: this.calculatePercentageChange(currentStats.total_views, previousStats.total_views),
                    link_clicks_change: this.calculatePercentageChange(currentLinkStats.total_clicks, previousLinkStats.total_clicks),
                },
                top_links: topLinks,
                daily_breakdown: dailyBreakdown,
            }, "Analytics overview retrieved successfully");
        }
        catch (err) {
            return (0, api_response_kit_1.InternalError)(err.message);
        }
    }
    static async getLinkAnalytics(userId, linkId, period = "this_week") {
        try {
            const creator = await CreatorRepository_1.CreatorRepository.getOneWhere({ user_id: userId });
            if (!creator) {
                return (0, api_response_kit_1.NotFound)("Creator profile not found");
            }
            const link = await LinkRepository_1.LinkRepository.findById(linkId);
            if (!link) {
                return (0, api_response_kit_1.NotFound)("Link not found");
            }
            if (link.creator_id !== creator.id) {
                return (0, api_response_kit_1.BadRequest)("You do not own this link");
            }
            const dateRange = this.getDateRange(period);
            const previousRange = this.getPreviousPeriodRange(period, dateRange);
            const [currentStats, previousStats] = await Promise.all([
                DailyStatRepository_1.DailyStatRepository.getAggregatedStats(creator.id, dateRange.start, dateRange.end, linkId),
                DailyStatRepository_1.DailyStatRepository.getAggregatedStats(creator.id, previousRange.start, previousRange.end, linkId),
            ]);
            const dailyBreakdown = await DailyStatRepository_1.DailyStatRepository.getLinkDailyBreakdown(creator.id, linkId, dateRange.start, dateRange.end);
            return (0, api_response_kit_1.Ok)({
                period,
                date_range: { start: dateRange.start, end: dateRange.end },
                link: {
                    id: link.id,
                    title: link.title,
                    url: link.url,
                },
                summary: {
                    total_clicks: currentStats.total_clicks,
                    clicks_change: this.calculatePercentageChange(currentStats.total_clicks, previousStats.total_clicks),
                },
                daily_breakdown: dailyBreakdown,
            }, "Link analytics retrieved successfully");
        }
        catch (err) {
            return (0, api_response_kit_1.InternalError)(err.message);
        }
    }
}
exports.AnalyticsService = AnalyticsService;
//# sourceMappingURL=analytics.service.js.map