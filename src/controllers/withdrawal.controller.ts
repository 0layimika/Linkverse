import { Response, Request } from "express";
import { ExpressResponse, InternalError } from "../utils/response";
import { WithdrawalService } from "../services/withdrawal.service";

export class WithdrawalController {
    static async getBanks(_req: Request, res: Response) {
        try {
            const result = await WithdrawalService.getBanks();
            return ExpressResponse(res, result);
        } catch (err: any) {
            return ExpressResponse(res, InternalError(err.message));
        }
    }

    static async resolveAccountNumber(req: Request, res: Response) {
        try {
            const { account_number, bank_code } = req.query;
            const result = await WithdrawalService.resolveAccountNumber(
                account_number as string,
                bank_code as string
            );
            return ExpressResponse(res, result);
        } catch (err: any) {
            return ExpressResponse(res, InternalError(err.message));
        }
    }

    static async setBankAccount(req: Request, res: Response) {
        try {
            const result = await WithdrawalService.setBankAccount(req.user.id, req.body);
            return ExpressResponse(res, result);
        } catch (err: any) {
            return ExpressResponse(res, InternalError(err.message));
        }
    }

    static async getBankAccount(req: Request, res: Response) {
        try {
            const result = await WithdrawalService.getBankAccount(req.user.id);
            return ExpressResponse(res, result);
        } catch (err: any) {
            return ExpressResponse(res, InternalError(err.message));
        }
    }

    static async initiateWithdrawal(req: Request, res: Response) {
        try {
            const result = await WithdrawalService.initiateWithdrawal(req.user.id, req.body);
            return ExpressResponse(res, result);
        } catch (err: any) {
            return ExpressResponse(res, InternalError(err.message));
        }
    }

    static async getWithdrawalHistory(req: Request, res: Response) {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
            const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

            const result = await WithdrawalService.getWithdrawalHistory(req.user.id, limit, offset);
            return ExpressResponse(res, result);
        } catch (err: any) {
            return ExpressResponse(res, InternalError(err.message));
        }
    }
}
