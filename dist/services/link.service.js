"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkService = void 0;
const LinkRepository_1 = require("../repositories/LinkRepository");
const CreatorRepository_1 = require("../repositories/CreatorRepository");
const api_response_kit_1 = require("@0layimika/api-response-kit");
class LinkService {
    static async createLink(userId, data) {
        try {
            const creator = await CreatorRepository_1.CreatorRepository.getOneWhere({ user_id: userId });
            if (!creator) {
                return (0, api_response_kit_1.NotFound)("Creator profile not found");
            }
            const maxPosition = await LinkRepository_1.LinkRepository.getMaxPosition(creator.id);
            const link = await LinkRepository_1.LinkRepository.create({
                creator_id: creator.id,
                title: data.title,
                url: data.url,
                icon: data.icon || null,
                position: maxPosition + 1,
                is_active: true,
            });
            return (0, api_response_kit_1.Ok)(link, "Link created successfully");
        }
        catch (err) {
            return (0, api_response_kit_1.InternalError)(err.message);
        }
    }
    static async getMyLinks(userId) {
        try {
            const creator = await CreatorRepository_1.CreatorRepository.getOneWhere({ user_id: userId });
            if (!creator) {
                return (0, api_response_kit_1.NotFound)("Creator profile not found");
            }
            const links = await LinkRepository_1.LinkRepository.getAllLinksForCreator(creator.id);
            return (0, api_response_kit_1.Ok)(links, "Links retrieved successfully");
        }
        catch (err) {
            return (0, api_response_kit_1.InternalError)(err.message);
        }
    }
    static async updateLink(userId, linkId, data) {
        try {
            const creator = await CreatorRepository_1.CreatorRepository.getOneWhere({ user_id: userId });
            if (!creator) {
                return (0, api_response_kit_1.NotFound)("Creator profile not found");
            }
            const link = await LinkRepository_1.LinkRepository.findById(linkId);
            if (!link) {
                return (0, api_response_kit_1.NotFound)("Link not found");
            }
            if (link.creator_id !== creator.id) {
                return (0, api_response_kit_1.BadRequest)("You do not own this link");
            }
            const updated = await LinkRepository_1.LinkRepository.update(linkId, data);
            return (0, api_response_kit_1.Ok)(updated, "Link updated successfully");
        }
        catch (err) {
            return (0, api_response_kit_1.InternalError)(err.message);
        }
    }
    static async deleteLink(userId, linkId) {
        try {
            const creator = await CreatorRepository_1.CreatorRepository.getOneWhere({ user_id: userId });
            if (!creator) {
                return (0, api_response_kit_1.NotFound)("Creator profile not found");
            }
            const link = await LinkRepository_1.LinkRepository.findById(linkId);
            if (!link) {
                return (0, api_response_kit_1.NotFound)("Link not found");
            }
            if (link.creator_id !== creator.id) {
                return (0, api_response_kit_1.BadRequest)("You do not own this link");
            }
            await LinkRepository_1.LinkRepository.deleteRecordById(linkId);
            return (0, api_response_kit_1.Ok)(null, "Link deleted successfully");
        }
        catch (err) {
            return (0, api_response_kit_1.InternalError)(err.message);
        }
    }
    static async activateLink(userId, linkId) {
        try {
            const creator = await CreatorRepository_1.CreatorRepository.getOneWhere({ user_id: userId });
            if (!creator) {
                return (0, api_response_kit_1.NotFound)("Creator profile not found");
            }
            const link = await LinkRepository_1.LinkRepository.findById(linkId);
            if (!link) {
                return (0, api_response_kit_1.NotFound)("Link not found");
            }
            if (link.creator_id !== creator.id) {
                return (0, api_response_kit_1.BadRequest)("You do not own this link");
            }
            const updated = await LinkRepository_1.LinkRepository.update(linkId, { is_active: true });
            return (0, api_response_kit_1.Ok)(updated, "Link activated successfully");
        }
        catch (err) {
            return (0, api_response_kit_1.InternalError)(err.message);
        }
    }
    static async deactivateLink(userId, linkId) {
        try {
            const creator = await CreatorRepository_1.CreatorRepository.getOneWhere({ user_id: userId });
            if (!creator) {
                return (0, api_response_kit_1.NotFound)("Creator profile not found");
            }
            const link = await LinkRepository_1.LinkRepository.findById(linkId);
            if (!link) {
                return (0, api_response_kit_1.NotFound)("Link not found");
            }
            if (link.creator_id !== creator.id) {
                return (0, api_response_kit_1.BadRequest)("You do not own this link");
            }
            const updated = await LinkRepository_1.LinkRepository.update(linkId, { is_active: false });
            return (0, api_response_kit_1.Ok)(updated, "Link deactivated successfully");
        }
        catch (err) {
            return (0, api_response_kit_1.InternalError)(err.message);
        }
    }
    static async reorderLinks(userId, linkIds) {
        try {
            const creator = await CreatorRepository_1.CreatorRepository.getOneWhere({ user_id: userId });
            if (!creator) {
                return (0, api_response_kit_1.NotFound)("Creator profile not found");
            }
            // Verify all links belong to the creator
            const links = await LinkRepository_1.LinkRepository.getAllLinksForCreator(creator.id);
            const creatorLinkIds = links.map(l => l.id);
            for (const id of linkIds) {
                if (!creatorLinkIds.includes(id)) {
                    return (0, api_response_kit_1.BadRequest)("One or more links do not belong to you");
                }
            }
            // Update positions
            for (let i = 0; i < linkIds.length; i++) {
                await LinkRepository_1.LinkRepository.update(linkIds[i], { position: i + 1 });
            }
            const updatedLinks = await LinkRepository_1.LinkRepository.getAllLinksForCreator(creator.id);
            return (0, api_response_kit_1.Ok)(updatedLinks, "Links reordered successfully");
        }
        catch (err) {
            return (0, api_response_kit_1.InternalError)(err.message);
        }
    }
}
exports.LinkService = LinkService;
//# sourceMappingURL=link.service.js.map