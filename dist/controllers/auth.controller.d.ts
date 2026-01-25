import { Request, Response } from "express";
export declare class AuthController {
    static register(req: Request, res: Response): Promise<any>;
    static verify(req: any, res: Response): Promise<any>;
    static forgotPassword(req: Request, res: Response): Promise<any>;
    static resetPassword(req: any, res: Response): Promise<any>;
    static login(req: Request, res: Response): Promise<any>;
    static resendVerificationLink(req: Request, res: Response): Promise<any>;
    static resendForgotPasswordLink(req: Request, res: Response): Promise<any>;
}
//# sourceMappingURL=auth.controller.d.ts.map