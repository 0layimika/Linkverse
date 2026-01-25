import {CreatorService} from "../services/creator.service";
import {Response, Request} from "express";
import {ExpressResponse, InternalError} from "../utils/response";
export class CreatorController {

    static async createCreator(req: Request, res: Response){
        try{
            const result = await CreatorService.createCreator(req.user.id,req.body)
            return ExpressResponse(res, result)
        }catch(err:any){
            return ExpressResponse(res,InternalError(err.message))
        }
    }

    static async updateCreator(req: Request, res: Response){
        try{
            const result = await CreatorService.updateCreator(req.user.id,req.body)
            return ExpressResponse(res, result)
        }catch(err:any){
            return ExpressResponse(res,InternalError(err.message))
        }
    }
}