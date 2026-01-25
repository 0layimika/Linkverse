import { updateSchema } from "../validators/creator.validator";
export declare class CreatorService {
    static createCreator(user_id: number, data: any): Promise<import("@0layimika/api-response-kit").ApiError | import("@0layimika/api-response-kit").ApiSuccess<import("../repositories/CreatorRepository").Creator>>;
    static updateCreator(id: number, data: updateSchema["body"]): Promise<import("@0layimika/api-response-kit").ApiError | import("@0layimika/api-response-kit").ApiSuccess<import("../repositories/CreatorRepository").Creator>>;
}
//# sourceMappingURL=creator.service.d.ts.map