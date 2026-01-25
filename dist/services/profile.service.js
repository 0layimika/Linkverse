"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileService = void 0;
const CreatorRepository_1 = require("../repositories/CreatorRepository");
const LinkRepository_1 = require("../repositories/LinkRepository");
const api_response_kit_1 = require("@0layimika/api-response-kit");
class ProfileService {
    static async getPublicProfile(username) {
        try {
            const creator = await CreatorRepository_1.CreatorRepository.getOneWhere({ username });
            if (!creator) {
                return (0, api_response_kit_1.NotFound)("Creator not found");
            }
            // Get only active links for public view
            const links = await LinkRepository_1.LinkRepository.getActiveLinksForCreator(creator.id);
            return (0, api_response_kit_1.Ok)({
                username: creator.username,
                first_name: creator.first_name,
                last_name: creator.last_name,
                bio: creator.bio,
                avatar_url: creator.avatar_url,
                links: links.map(link => ({
                    id: link.id,
                    title: link.title,
                    url: link.url,
                    icon: link.icon,
                    position: link.position,
                })),
            }, "Profile retrieved successfully");
        }
        catch (err) {
            return (0, api_response_kit_1.InternalError)(err.message);
        }
    }
}
exports.ProfileService = ProfileService;
//# sourceMappingURL=profile.service.js.map