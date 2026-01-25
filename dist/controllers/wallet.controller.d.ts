import { Response, Request } from "express";
export declare class WalletController {
    static getMyWallet(req: Request, res: Response): Promise<void>;
    static getWalletBalance(req: Request, res: Response): Promise<void>;
    static getTransactionHistory(req: Request, res: Response): Promise<void>;
    static initiateGift(req: Request, res: Response): Promise<void>;
    static verifyGiftPayment(req: Request, res: Response): Promise<void>;
    static handlePaystackWebhook(req: Request, res: Response): Promise<void>;
    static handleKoraWebhook(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=wallet.controller.d.ts.map