"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkController = void 0;
const response_1 = require("../utils/response");
const link_service_1 = require("../services/link.service");
class LinkController {
    static async createLink(req, res) {
        try {
            const result = await link_service_1.LinkService.createLink(req.user.id, req.body);
            return (0, response_1.ExpressResponse)(res, result);
        }
        catch (err) {
            return (0, response_1.ExpressResponse)(res, (0, response_1.InternalError)(err.message));
        }
    }
    static async getMyLinks(req, res) {
        try {
            const result = await link_service_1.LinkService.getMyLinks(req.user.id);
            return (0, response_1.ExpressResponse)(res, result);
        }
        catch (err) {
            return (0, response_1.ExpressResponse)(res, (0, response_1.InternalError)(err.message));
        }
    }
    static async updateLink(req, res) {
        try {
            const linkId = parseInt(req.params.id);
            const result = await link_service_1.LinkService.updateLink(req.user.id, linkId, req.body);
            return (0, response_1.ExpressResponse)(res, result);
        }
        catch (err) {
            return (0, response_1.ExpressResponse)(res, (0, response_1.InternalError)(err.message));
        }
    }
    static async deleteLink(req, res) {
        try {
            const linkId = parseInt(req.params.id);
            const result = await link_service_1.LinkService.deleteLink(req.user.id, linkId);
            return (0, response_1.ExpressResponse)(res, result);
        }
        catch (err) {
            return (0, response_1.ExpressResponse)(res, (0, response_1.InternalError)(err.message));
        }
    }
    static async activateLink(req, res) {
        try {
            const linkId = parseInt(req.params.id);
            const result = await link_service_1.LinkService.activateLink(req.user.id, linkId);
            return (0, response_1.ExpressResponse)(res, result);
        }
        catch (err) {
            return (0, response_1.ExpressResponse)(res, (0, response_1.InternalError)(err.message));
        }
    }
    static async deactivateLink(req, res) {
        try {
            const linkId = parseInt(req.params.id);
            const result = await link_service_1.LinkService.deactivateLink(req.user.id, linkId);
            return (0, response_1.ExpressResponse)(res, result);
        }
        catch (err) {
            return (0, response_1.ExpressResponse)(res, (0, response_1.InternalError)(err.message));
        }
    }
    static async reorderLinks(req, res) {
        try {
            const result = await link_service_1.LinkService.reorderLinks(req.user.id, req.body.linkIds);
            return (0, response_1.ExpressResponse)(res, result);
        }
        catch (err) {
            return (0, response_1.ExpressResponse)(res, (0, response_1.InternalError)(err.message));
        }
    }
}
exports.LinkController = LinkController;
//# sourceMappingURL=link.controller.js.map