import { Response, Request } from "express";
import { ExpressResponse, InternalError } from "../utils/response";
import { WalletService } from "../services/wallet.service";
import { GiftService } from "../services/gift.service";

export class WalletController {
    static async getMyWallet(req: Request, res: Response) {
        try {
            const result = await WalletService.getMyWallet(req.user.id);
            return ExpressResponse(res, result);
        } catch (err: any) {
            return ExpressResponse(res, InternalError(err.message));
        }
    }

    static async getWalletBalance(req: Request, res: Response) {
        try {
            const result = await WalletService.getWalletBalance(req.user.id);
            return ExpressResponse(res, result);
        } catch (err: any) {
            return ExpressResponse(res, InternalError(err.message));
        }
    }

    static async getTransactionHistory(req: Request, res: Response) {
        try {
            const type = req.query.type as 'gift' | 'withdrawal' | undefined;
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
            const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

            const result = await WalletService.getTransactionHistory(req.user.id, type, limit, offset);
            return ExpressResponse(res, result);
        } catch (err: any) {
            return ExpressResponse(res, InternalError(err.message));
        }
    }

    // Public endpoint - gift a creator
    static async initiateGift(req: Request, res: Response) {
        try {
            const username = req.params.username as string;
            const result = await GiftService.initiateGift(username, req.body);
            return ExpressResponse(res, result);
        } catch (err: any) {
            return ExpressResponse(res, InternalError(err.message));
        }
    }

    // Verify payment callback
    static async verifyGiftPayment(req: Request, res: Response) {
        try {
            const { reference } = req.query;
            const result = await GiftService.verifyGiftPayment(reference as string);
            return ExpressResponse(res, result);
        } catch (err: any) {
            return ExpressResponse(res, InternalError(err.message));
        }
    }

    // Webhook handlers
    static async handlePaystackWebhook(req: Request, res: Response) {
        try {
            const signature = req.headers['x-paystack-signature'] as string;
            const payload = JSON.stringify(req.body);
            const result = await GiftService.handleWebhook('paystack', payload, signature, req.body);
            return ExpressResponse(res, result);
        } catch (err: any) {
            return ExpressResponse(res, InternalError(err.message));
        }
    }

    static async handleKoraWebhook(req: Request, res: Response) {
        try {
            const signature = req.headers['x-korapay-signature'] as string;
            const payload = JSON.stringify(req.body);
            const result = await GiftService.handleWebhook('kora', payload, signature, req.body);
            return ExpressResponse(res, result);
        } catch (err: any) {
            return ExpressResponse(res, InternalError(err.message));
        }
    }
}
