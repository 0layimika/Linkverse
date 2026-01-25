import { Response, Request } from "express";
export declare class WithdrawalController {
    static getBanks(_req: Request, res: Response): Promise<void>;
    static resolveAccountNumber(req: Request, res: Response): Promise<void>;
    static setBankAccount(req: Request, res: Response): Promise<void>;
    static getBankAccount(req: Request, res: Response): Promise<void>;
    static initiateWithdrawal(req: Request, res: Response): Promise<void>;
    static getWithdrawalHistory(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=withdrawal.controller.d.ts.map