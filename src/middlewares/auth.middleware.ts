import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { ExpressResponse, Unauthorized } from "../utils/response";
import { JWT_SECRET } from "../config/env";

export const auth = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];
    if (!token) return ExpressResponse(res, Unauthorized("Token not provided in header"));
    try {
        const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
        req.user = payload;
        next();
    } catch (error) {
        console.error(error);
        return ExpressResponse(res, Unauthorized("Expired or Invalid Token"));
    }
};
