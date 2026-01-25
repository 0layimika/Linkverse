"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileController = void 0;
const response_1 = require("../utils/response");
const profile_service_1 = require("../services/profile.service");
class ProfileController {
    static async getPublicProfile(req, res) {
        try {
            const username = req.params.username;
            const result = await profile_service_1.ProfileService.getPublicProfile(username);
            return (0, response_1.ExpressResponse)(res, result);
        }
        catch (err) {
            return (0, response_1.ExpressResponse)(res, (0, response_1.InternalError)(err.message));
        }
    }
}
exports.ProfileController = ProfileController;
//# sourceMappingURL=profile.controller.js.map