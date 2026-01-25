import {BadRequest, ExpressResponse} from "../utils/response";
import {Request, NextFunction, Response} from "express";
import {ZodError, ZodSchema} from "zod"
export const validate = (schema:ZodSchema<any>)=>{
    return (req:Request,res:Response, next:NextFunction) => {
        try{
            schema.parse({
                body: req.body,
                params: req.params,
                query: req.query,
            })
            next()
        }catch (err: any) {
            if (err instanceof ZodError && err.issues.length > 0) {
                // Take only the first error
                const e = err.issues[0]
                const message = e.message;

                return ExpressResponse(res, BadRequest(`${message}`));
            }
            return ExpressResponse(res, BadRequest(err.message));
        }
    }
}