import { Response, Request } from "express";
export declare class AnalyticsController {
    static trackProfileView(req: Request, res: Response): Promise<void>;
    static trackLinkClick(req: Request, res: Response): Promise<void>;
    static getOverview(req: Request, res: Response): Promise<void>;
    static getLinkAnalytics(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=analytics.controller.d.ts.map