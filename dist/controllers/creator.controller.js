"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreatorController = void 0;
const creator_service_1 = require("../services/creator.service");
const response_1 = require("../utils/response");
class CreatorController {
    static async createCreator(req, res) {
        try {
            const result = await creator_service_1.CreatorService.createCreator(req.user.id, req.body);
            return (0, response_1.ExpressResponse)(res, result);
        }
        catch (err) {
            return (0, response_1.ExpressResponse)(res, (0, response_1.InternalError)(err.message));
        }
    }
    static async updateCreator(req, res) {
        try {
            const result = await creator_service_1.CreatorService.updateCreator(req.user.id, req.body);
            return (0, response_1.ExpressResponse)(res, result);
        }
        catch (err) {
            return (0, response_1.ExpressResponse)(res, (0, response_1.InternalError)(err.message));
        }
    }
}
exports.CreatorController = CreatorController;
//# sourceMappingURL=creator.controller.js.map