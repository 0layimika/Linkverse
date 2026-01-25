import { Request, NextFunction, Response } from "express";
import { ZodSchema } from "zod";
export declare const validate: (schema: ZodSchema<any>) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=validate.d.ts.map