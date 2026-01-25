import { Response, Request } from "express";
import { ExpressResponse, InternalError } from "../utils/response";
import { AnalyticsService } from "../services/analytics.service";

function getClientIp(req: Request): string {
    const forwardedFor = req.headers["x-forwarded-for"];
    if (forwardedFor) {
        const ip = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
        return ip.split(",")[0].trim();
    }
    return req.ip || "unknown";
}

function getHeader(req: Request, name: string): string | undefined {
    const header = req.headers[name];
    if (Array.isArray(header)) {
        return header[0];
    }
    return header;
}

export class AnalyticsController {
    static async trackProfileView(req: Request, res: Response) {
        try {
            const username = req.params.username as string;
            const ip = getClientIp(req);
            const userAgent = getHeader(req, "user-agent");
            const referrer = getHeader(req, "referer") || getHeader(req, "referrer");

            const result = await AnalyticsService.trackProfileView(username, {
                ip,
                userAgent,
                referrer,
            });
            return ExpressResponse(res, result);
        } catch (err: any) {
            return ExpressResponse(res, InternalError(err.message));
        }
    }

    static async trackLinkClick(req: Request, res: Response) {
        try {
            const linkId = parseInt(req.params.linkId as string);
            const ip = getClientIp(req);
            const userAgent = getHeader(req, "user-agent");
            const referrer = getHeader(req, "referer") || getHeader(req, "referrer");

            const result = await AnalyticsService.trackLinkClick(linkId, {
                ip,
                userAgent,
                referrer,
            });
            return ExpressResponse(res, result);
        } catch (err: any) {
            return ExpressResponse(res, InternalError(err.message));
        }
    }

    static async getOverview(req: Request, res: Response) {
        try {
            const period = (req.query.period as string) || "this_week";
            const result = await AnalyticsService.getOverview(
                req.user.id,
                period as "today" | "this_week" | "this_month" | "all_time"
            );
            return ExpressResponse(res, result);
        } catch (err: any) {
            return ExpressResponse(res, InternalError(err.message));
        }
    }

    static async getLinkAnalytics(req: Request, res: Response) {
        try {
            const linkId = parseInt(req.params.linkId as string);
            const period = (req.query.period as string) || "this_week";
            const result = await AnalyticsService.getLinkAnalytics(
                req.user.id,
                linkId,
                period as "today" | "this_week" | "this_month" | "all_time"
            );
            return ExpressResponse(res, result);
        } catch (err: any) {
            return ExpressResponse(res, InternalError(err.message));
        }
    }
}
