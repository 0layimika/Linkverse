import { Response, Request } from "express";
import { ExpressResponse, InternalError } from "../utils/response";
import { LinkService } from "../services/link.service";

export class LinkController {
    static async createLink(req: Request, res: Response) {
        try {
            const result = await LinkService.createLink(req.user.id, req.body);
            return ExpressResponse(res, result);
        } catch (err: any) {
            return ExpressResponse(res, InternalError(err.message));
        }
    }

    static async getMyLinks(req: Request, res: Response) {
        try {
            const result = await LinkService.getMyLinks(req.user.id);
            return ExpressResponse(res, result);
        } catch (err: any) {
            return ExpressResponse(res, InternalError(err.message));
        }
    }

    static async updateLink(req: Request, res: Response) {
        try {
            const linkId = parseInt(req.params.id as string);
            const result = await LinkService.updateLink(req.user.id, linkId, req.body);
            return ExpressResponse(res, result);
        } catch (err: any) {
            return ExpressResponse(res, InternalError(err.message));
        }
    }

    static async deleteLink(req: Request, res: Response) {
        try {
            const linkId = parseInt(req.params.id as string);
            const result = await LinkService.deleteLink(req.user.id, linkId);
            return ExpressResponse(res, result);
        } catch (err: any) {
            return ExpressResponse(res, InternalError(err.message));
        }
    }

    static async activateLink(req: Request, res: Response) {
        try {
            const linkId = parseInt(req.params.id as string);
            const result = await LinkService.activateLink(req.user.id, linkId);
            return ExpressResponse(res, result);
        } catch (err: any) {
            return ExpressResponse(res, InternalError(err.message));
        }
    }

    static async deactivateLink(req: Request, res: Response) {
        try {
            const linkId = parseInt(req.params.id as string);
            const result = await LinkService.deactivateLink(req.user.id, linkId);
            return ExpressResponse(res, result);
        } catch (err: any) {
            return ExpressResponse(res, InternalError(err.message));
        }
    }

    static async reorderLinks(req: Request, res: Response) {
        try {
            const result = await LinkService.reorderLinks(req.user.id, req.body.linkIds);
            return ExpressResponse(res, result);
        } catch (err: any) {
            return ExpressResponse(res, InternalError(err.message));
        }
    }
}
