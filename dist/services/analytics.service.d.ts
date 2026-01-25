type Period = "today" | "this_week" | "this_month" | "all_time";
interface TrackingData {
    ip: string;
    userAgent?: string;
    referrer?: string;
}
export declare class AnalyticsService {
    private static hashIp;
    private static getDateRange;
    private static getPreviousPeriodRange;
    private static calculatePercentageChange;
    static trackProfileView(username: string, data: TrackingData): Promise<import("@0layimika/api-response-kit").ApiError | import("@0layimika/api-response-kit").ApiSuccess<null>>;
    static trackLinkClick(linkId: number, data: TrackingData): Promise<import("@0layimika/api-response-kit").ApiError | import("@0layimika/api-response-kit").ApiSuccess<{
        url: string;
    }>>;
    static getOverview(userId: number, period?: Period): Promise<import("@0layimika/api-response-kit").ApiError | import("@0layimika/api-response-kit").ApiSuccess<{
        period: Period;
        date_range: {
            start: string;
            end: string;
        };
        summary: {
            total_profile_views: number;
            total_link_clicks: number;
            unique_visitors: number;
            profile_views_change: number;
            link_clicks_change: number;
        };
        top_links: {
            link_id: number;
            title: string;
            url: string;
            clicks: number;
        }[];
        daily_breakdown: import("../repositories/DailyStatRepository").DailyBreakdown[];
    }>>;
    static getLinkAnalytics(userId: number, linkId: number, period?: Period): Promise<import("@0layimika/api-response-kit").ApiError | import("@0layimika/api-response-kit").ApiSuccess<{
        period: Period;
        date_range: {
            start: string;
            end: string;
        };
        link: {
            id: number;
            title: string;
            url: string;
        };
        summary: {
            total_clicks: number;
            clicks_change: number;
        };
        daily_breakdown: import("../repositories/DailyStatRepository").DailyBreakdown[];
    }>>;
}
export {};
//# sourceMappingURL=analytics.service.d.ts.map