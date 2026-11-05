import type { Request, Response, NextFunction } from 'express';
import { UserRepository } from '../repositories/UserRepository';
import { ExpressResponse, Forbidden, InternalError } from '../utils/response';

export function isAdminEmail(email: string): boolean {
    return (process.env.ADMIN_EMAILS || '').split(',')
        .map((entry) => entry.trim().toLowerCase()).filter(Boolean).includes(email.trim().toLowerCase());
}

// Always check the persisted identity, never a JWT email or browser-stored role.
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
    try {
        const user = await new UserRepository().findById(req.user.id);
        if (!user || !user.verified || user.is_blocked || !isAdminEmail(user.email)) {
            return ExpressResponse(res, Forbidden('Administrator access required'));
        }
        res.setHeader('Cache-Control', 'no-store');
        return next();
    } catch {
        return ExpressResponse(res, InternalError('Unable to verify administrator access'));
    }
}
