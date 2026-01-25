"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsController = void 0;
const response_1 = require("../utils/response");
const analytics_service_1 = require("../services/analytics.service");
function getClientIp(req) {
    const forwardedFor = req.headers["x-forwarded-for"];
    if (forwardedFor) {
        const ip = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
        return ip.split(",")[0].trim();
    }
    return req.ip || "unknown";
}
function getHeader(req, name) {
    const header = req.headers[name];
    if (Array.isArray(header)) {
        return header[0];
    }
    return header;
}
class AnalyticsController {
    static async trackProfileView(req, res) {
        try {
            const username = req.params.username;
            const ip = getClientIp(req);
            const userAgent = getHeader(req, "user-agent");
            const referrer = getHeader(req, "referer") || getHeader(req, "referrer");
            const result = await analytics_service_1.AnalyticsService.trackProfileView(username, {
                ip,
                userAgent,
                referrer,
            });
            return (0, response_1.ExpressResponse)(res, result);
        }
        catch (err) {
            return (0, response_1.ExpressResponse)(res, (0, response_1.InternalError)(err.message));
        }
    }
    static async trackLinkClick(req, res) {
        try {
            const linkId = parseInt(req.params.linkId);
            const ip = getClientIp(req);
            const userAgent = getHeader(req, "user-agent");
            const referrer = getHeader(req, "referer") || getHeader(req, "referrer");
            const result = await analytics_service_1.AnalyticsService.trackLinkClick(linkId, {
                ip,
                userAgent,
                referrer,
            });
            return (0, response_1.ExpressResponse)(res, result);
        }
        catch (err) {
            return (0, response_1.ExpressResponse)(res, (0, response_1.InternalError)(err.message));
        }
    }
    static async getOverview(req, res) {
        try {
            const period = req.query.period || "this_week";
            const result = await analytics_service_1.AnalyticsService.getOverview(req.user.id, period);
            return (0, response_1.ExpressResponse)(res, result);
        }
        catch (err) {
            return (0, response_1.ExpressResponse)(res, (0, response_1.InternalError)(err.message));
        }
    }
    static async getLinkAnalytics(req, res) {
        try {
            const linkId = parseInt(req.params.linkId);
            const period = req.query.period || "this_week";
            const result = await analytics_service_1.AnalyticsService.getLinkAnalytics(req.user.id, linkId, period);
            return (0, response_1.ExpressResponse)(res, result);
        }
        catch (err) {
            return (0, response_1.ExpressResponse)(res, (0, response_1.InternalError)(err.message));
        }
    }
}
exports.AnalyticsController = AnalyticsController;
//# sourceMappingURL=analytics.controller.js.map