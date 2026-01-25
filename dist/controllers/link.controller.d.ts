import { Response, Request } from "express";
export declare class LinkController {
    static createLink(req: Request, res: Response): Promise<void>;
    static getMyLinks(req: Request, res: Response): Promise<void>;
    static updateLink(req: Request, res: Response): Promise<void>;
    static deleteLink(req: Request, res: Response): Promise<void>;
    static activateLink(req: Request, res: Response): Promise<void>;
    static deactivateLink(req: Request, res: Response): Promise<void>;
    static reorderLinks(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=link.controller.d.ts.map