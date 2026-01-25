"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreatorService = void 0;
const CreatorRepository_1 = require("../repositories/CreatorRepository");
const api_response_kit_1 = require("@0layimika/api-response-kit");
class CreatorService {
    static async createCreator(user_id, data) {
        try {
            const existingcreator = await CreatorRepository_1.CreatorRepository.getOneWhere({ username: data.username });
            if (existingcreator) {
                return (0, api_response_kit_1.BadRequest)("This username is taken");
            }
            const creator = await CreatorRepository_1.CreatorRepository.create({ user_id: user_id, ...data }, { user: true });
            return (0, api_response_kit_1.Ok)(creator, "Creator Profile created successfully");
        }
        catch (err) {
            return (0, api_response_kit_1.InternalError)(err.message);
        }
    }
    static async updateCreator(id, data) {
        try {
            const existingcreator = await CreatorRepository_1.CreatorRepository.getOneWhere({ user_id: id }, { user: true });
            if (!existingcreator) {
                return (0, api_response_kit_1.BadRequest)("User does not exist here");
            }
            if (data.username) {
                const usernameexists = await CreatorRepository_1.CreatorRepository.getOneWhere({ username: data.username });
                if (usernameexists && usernameexists.id !== existingcreator.id) {
                    return (0, api_response_kit_1.BadRequest)("Username is taken");
                }
            }
            const updated = await CreatorRepository_1.CreatorRepository.update(existingcreator.id, data);
            return (0, api_response_kit_1.Ok)(updated, "Creator Profile updated successfully");
        }
        catch (err) {
            return (0, api_response_kit_1.InternalError)(err.message);
        }
    }
}
exports.CreatorService = CreatorService;
//# sourceMappingURL=creator.service.js.map