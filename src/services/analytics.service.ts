import { createHash } from "crypto";
import { ClickEventRepository, ClickEvent } from "../repositories/ClickEventRepository";
import { DailyStatRepository } from "../repositories/DailyStatRepository";
import { CreatorRepository } from "../repositories/CreatorRepository";
import { LinkRepository } from "../repositories/LinkRepository";
import { BadRequest, InternalError, NotFound, Ok } from "@0layimika/api-response-kit";
import { ClickEventModel } from "../models/ClickEventModel";

type Period = "today" | "this_week" | "this_month" | "all_time";

interface DateRange {
    start: string;
    end: string;
}

interface TrackingData {
    ip: string;
    userAgent?: string;
    referrer?: string;
    source?: string;
    medium?: string;
    campaign?: string;
}

export class AnalyticsService {
    private static hashIp(ip: string): string {
        return createHash("sha256").update(ip).digest("hex");
    }

    private static getDateRange(period: Period): DateRange {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        let start: Date;
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

    private static getPreviousPeriodRange(_period: Period, currentRange: DateRange): DateRange {
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

    private static calculatePercentageChange(current: number, previous: number): number {
        if (previous === 0) {
            return current > 0 ? 100 : 0;
        }
        return Math.round(((current - previous) / previous) * 100);
    }

    static async trackProfileView(username: string, data: TrackingData) {
        try {
            const creator = await CreatorRepository.findByUsername(username);
            if (!creator) {
                return NotFound("Creator not found");
            }

            const ipHash = this.hashIp(data.ip);
            const today = new Date().toISOString().split("T")[0];

            const hasRecent = await ClickEventRepository.hasRecentEvent(
                creator.id,
                ipHash,
                "profile_view",
                null,
                30
            );

            await ClickEventRepository.create({
                creator_id: creator.id,
                link_id: null,
                event_type: "profile_view",
                ip_hash: ipHash,
                user_agent: data.userAgent || null,
                referrer: data.referrer || null,
                source: data.source || null,
                medium: data.medium || null,
                campaign: data.campaign || null,
            } as Partial<ClickEvent>);

            await DailyStatRepository.upsertStat(
                creator.id,
                null,
                today,
                1,
                0,
                !hasRecent
            );

            return Ok(null, "Profile view tracked");
        } catch (err: any) {
            return InternalError(err.message);
        }
    }

    static async trackLinkClick(linkId: number, data: TrackingData) {
        try {
            const link = await LinkRepository.findById(linkId);
            if (!link) {
                return NotFound("Link not found");
            }

            const ipHash = this.hashIp(data.ip);
            const today = new Date().toISOString().split("T")[0];

            const hasRecent = await ClickEventRepository.hasRecentEvent(
                link.creator_id,
                ipHash,
                "link_click",
                linkId,
                30
            );

            await ClickEventRepository.create({
                creator_id: link.creator_id,
                link_id: linkId,
                event_type: "link_click",
                ip_hash: ipHash,
                user_agent: data.userAgent || null,
                referrer: data.referrer || null,
                source: data.source || null,
                medium: data.medium || null,
                campaign: data.campaign || null,
            } as Partial<ClickEvent>);

            await DailyStatRepository.upsertStat(
                link.creator_id,
                linkId,
                today,
                0,
                1,
                !hasRecent
            );

            return Ok({ url: link.url }, "Link click tracked");
        } catch (err: any) {
            return InternalError(err.message);
        }
    }

    static async getOverview(userId: number, period: Period = "this_week") {
        try {
            const creator = await CreatorRepository.getOneWhere({ user_id: userId });
            if (!creator) {
                return NotFound("Creator profile not found");
            }

            const dateRange = this.getDateRange(period);
            const previousRange = this.getPreviousPeriodRange(period, dateRange);

            const [currentStats, previousStats, currentLinkStats, previousLinkStats] = await Promise.all([
                DailyStatRepository.getAggregatedStats(creator.id, dateRange.start, dateRange.end),
                DailyStatRepository.getAggregatedStats(creator.id, previousRange.start, previousRange.end),
                DailyStatRepository.getAllLinksAggregatedStats(creator.id, dateRange.start, dateRange.end),
                DailyStatRepository.getAllLinksAggregatedStats(creator.id, previousRange.start, previousRange.end),
            ]);

            const topLinksStats = await DailyStatRepository.getTopLinks(
                creator.id,
                dateRange.start,
                dateRange.end,
                5
            );

            const linkIds = topLinksStats.map((l) => l.link_id);
            const links = await Promise.all(linkIds.map((id) => LinkRepository.findById(id)));

            const topLinks = topLinksStats.map((stat) => {
                const link = links.find((l) => l?.id === stat.link_id);
                return {
                    link_id: stat.link_id,
                    title: link?.title || "Unknown",
                    url: link?.url || "",
                    clicks: stat.clicks,
                };
            });

            const dailyBreakdown = await DailyStatRepository.getDailyBreakdown(
                creator.id,
                dateRange.start,
                dateRange.end
            );

            const sourceEndExclusive = new Date(`${dateRange.end}T00:00:00.000Z`);
            sourceEndExclusive.setUTCDate(sourceEndExclusive.getUTCDate() + 1);
            const sourceRows = await ClickEventModel.query()
                .select("source")
                .count("id as visits")
                .where("creator_id", creator.id)
                .where("event_type", "profile_view")
                .where("created_at", ">=", dateRange.start)
                .where("created_at", "<", sourceEndExclusive.toISOString())
                .groupBy("source")
                .orderBy("visits", "desc")
                .limit(8);

            return Ok({
                period,
                date_range: { start: dateRange.start, end: dateRange.end },
                summary: {
                    total_profile_views: currentStats.total_views,
                    total_link_clicks: currentLinkStats.total_clicks,
                    unique_visitors: currentStats.unique_visitors,
                    profile_views_change: this.calculatePercentageChange(
                        currentStats.total_views,
                        previousStats.total_views
                    ),
                    link_clicks_change: this.calculatePercentageChange(
                        currentLinkStats.total_clicks,
                        previousLinkStats.total_clicks
                    ),
                },
                top_links: topLinks,
                top_sources: sourceRows.map((row: any) => ({ source: row.source || "direct", visits: Number(row.visits || 0) })),
                daily_breakdown: dailyBreakdown,
            }, "Analytics overview retrieved successfully");
        } catch (err: any) {
            return InternalError(err.message);
        }
    }

    static async getLinkAnalytics(userId: number, linkId: number, period: Period = "this_week") {
        try {
            const creator = await CreatorRepository.getOneWhere({ user_id: userId });
            if (!creator) {
                return NotFound("Creator profile not found");
            }

            const link = await LinkRepository.findById(linkId);
            if (!link) {
                return NotFound("Link not found");
            }

            if (link.creator_id !== creator.id) {
                return BadRequest("You do not own this link");
            }

            const dateRange = this.getDateRange(period);
            const previousRange = this.getPreviousPeriodRange(period, dateRange);

            const [currentStats, previousStats] = await Promise.all([
                DailyStatRepository.getAggregatedStats(creator.id, dateRange.start, dateRange.end, linkId),
                DailyStatRepository.getAggregatedStats(creator.id, previousRange.start, previousRange.end, linkId),
            ]);

            const dailyBreakdown = await DailyStatRepository.getLinkDailyBreakdown(
                creator.id,
                linkId,
                dateRange.start,
                dateRange.end
            );

            return Ok({
                period,
                date_range: { start: dateRange.start, end: dateRange.end },
                link: {
                    id: link.id,
                    title: link.title,
                    url: link.url,
                },
                summary: {
                    total_clicks: currentStats.total_clicks,
                    clicks_change: this.calculatePercentageChange(
                        currentStats.total_clicks,
                        previousStats.total_clicks
                    ),
                },
                daily_breakdown: dailyBreakdown,
            }, "Link analytics retrieved successfully");
        } catch (err: any) {
            return InternalError(err.message);
        }
    }
}
