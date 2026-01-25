import { Response, Request } from "express";
import { ExpressResponse, InternalError } from "../utils/response";
import { ProfileService } from "../services/profile.service";

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
}
