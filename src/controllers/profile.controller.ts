import { Response, Request } from "express";
import QRCode from "qrcode";
import { ExpressResponse, InternalError, NotFound } from "../utils/response";
import { ProfileService } from "../services/profile.service";
import { CreatorRepository } from "../repositories/CreatorRepository";
import { FRONTEND_URL } from "../config/env";

export class ProfileController {
    static async getPublicProfile(req: Request, res: Response) {
        try {
            const username = req.params.username as string;
            const result = await ProfileService.getPublicProfile(username);
            return ExpressResponse(res, result);
        } catch (err: any) {
            return ExpressResponse(res, InternalError(err.message));
        }
    }

    static async getProfileConfig(req: Request, res: Response) {
        try {
            const result = await ProfileService.getProfileConfig(req.user!.id);
            return ExpressResponse(res, result);
        } catch (err: any) {
            return ExpressResponse(res, InternalError(err.message));
        }
    }

    static async updateProfileConfig(req: Request, res: Response) {
        try {
            const result = await ProfileService.updateProfileConfig(req.user!.id, req.body);
            return ExpressResponse(res, result);
        } catch (err: any) {
            return ExpressResponse(res, InternalError(err.message));
        }
    }

    static async getSocialLinks(req: Request, res: Response) {
        try {
            const result = await ProfileService.getSocialLinks(req.user!.id);
            return ExpressResponse(res, result);
        } catch (err: any) {
            return ExpressResponse(res, InternalError(err.message));
        }
    }

    static async replaceSocialLinks(req: Request, res: Response) {
        try {
            const result = await ProfileService.replaceSocialLinks(req.user!.id, req.body);
            return ExpressResponse(res, result);
        } catch (err: any) {
            return ExpressResponse(res, InternalError(err.message));
        }
    }

    static async getQRCode(req: Request, res: Response) {
        try {
            const username = req.params.username as string;
            const creator = await CreatorRepository.findByUsername(username);
            if (!creator) {
                return ExpressResponse(res, NotFound("Creator not found"));
            }

            const publicUrl = `${FRONTEND_URL.replace(/\/$/, "")}/${creator.username}`;
            const qrBuffer = await QRCode.toBuffer(publicUrl, {
                type: "png",
                width: 400,
                margin: 2,
            });

            res.setHeader("Content-Type", "image/png");
            res.setHeader("Content-Disposition", `attachment; filename="${creator.username}-qr.png"`);
            res.send(qrBuffer);
        } catch (err: any) {
            return ExpressResponse(res, InternalError(err.message));
        }
    }
}
