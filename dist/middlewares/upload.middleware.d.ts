import multer from "multer";
import { Request } from "express";
import { Response, NextFunction } from "express";
export declare const upload: multer.Multer;
export declare const validateFileSize: (req: Request, res: Response, next: NextFunction) => Response | void;
export declare const uploadSingle: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
//# sourceMappingURL=upload.middleware.d.ts.map