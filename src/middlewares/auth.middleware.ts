import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { ExpressResponse, Forbidden, InternalError, Unauthorized } from "../utils/response";
import { JWT_SECRET } from "../config/env";
import { UserRepository } from '../repositories/UserRepository';

const userRepo = new UserRepository();

export const auth = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];
    if (!token) return ExpressResponse(res, Unauthorized("Token not provided in header"));
    let payload: JwtPayload;
    try {
        payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
        if (!Number.isSafeInteger(payload.id) || payload.id <= 0) {
            return ExpressResponse(res, Unauthorized("Expired or Invalid Token"));
        }
    } catch (error) {
        console.error(error);
        return ExpressResponse(res, Unauthorized("Expired or Invalid Token"));
    }

    try {
        const user = await userRepo.findById(payload.id);
        if (!user) return ExpressResponse(res, Unauthorized("User not found"));
        if (user.is_blocked) return ExpressResponse(res, Forbidden("Your account has been blocked"));
    } catch (error) {
        console.error(error);
        return ExpressResponse(res, InternalError("Unable to authenticate user"));
    }

    req.user = payload;
    next();
};
