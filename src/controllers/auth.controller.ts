import { Request, Response, } from "express";
import { AuthService } from "../services/auth.service";
import { ExpressResponse, InternalError } from "../utils/response";
import { ResetPassword, verifySchema } from "../validators/auth.validator";
export class AuthController {
    static async register(req: Request, res: Response): Promise<any> {
        try {
            const result = await AuthService.register(req.body)
            return ExpressResponse(res, result)
        } catch (err: any) {
            return ExpressResponse(res, InternalError(err.message))
        }
    }

    static async verify(req: any, res: Response): Promise<any> {
        try {
            const { query } = req as verifySchema
            const result = await AuthService.verify(query.token)
            return ExpressResponse(res, result)
        } catch (err: any) {
            return ExpressResponse(res, InternalError(err.message))
        }
    }

    static async forgotPassword(req: Request, res: Response): Promise<any> {
        try {
            const result = await AuthService.forgotPassword(req.body.email)
            return ExpressResponse(res, result)
        } catch (err: any) {
            return ExpressResponse(res, InternalError(err.message))
        }
    }

    static async resetPassword(req: any, res: Response): Promise<any> {
        try {
            const { query } = req as ResetPassword
            const result = await AuthService.resetPassword(query.token, req.body.newPassword)
            return ExpressResponse(res, result)
        } catch (err: any) {
            return ExpressResponse(res, InternalError(err.message))
        }
    }

    static async login(req: Request, res: Response): Promise<any> {
        try {
            const result = await AuthService.login(req.body)
            return ExpressResponse(res, result)
        } catch (err: any) {
            console.log(err)
            return ExpressResponse(res, InternalError(err.message))
        }
    }

    static async resendVerificationLink(req: Request, res: Response): Promise<any> {
        try {
            const result = await AuthService.resendVerificationLink(req.body.email)
            return ExpressResponse(res, result)
        } catch (err: any) {
            return ExpressResponse(res, InternalError(err.message))
        }
    }

    static async resendForgotPasswordLink(req: Request, res: Response): Promise<any> {
        try {
            const result = await AuthService.resendForgotPasswordLink(req.body.email)
            return ExpressResponse(res, result)
        } catch (err: any) {
            return ExpressResponse(res, InternalError(err.message))
        }
    }
}