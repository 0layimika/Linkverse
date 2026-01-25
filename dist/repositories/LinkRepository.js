"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
const LinkModel_1 = require("../models/LinkModel");
class LinkRepositoryClass extends BaseRepository_1.BaseRepository {
    constructor() {
        super(LinkModel_1.LinkModel);
    }
    async getActiveLinksForCreator(creatorId) {
        return await LinkModel_1.LinkModel.query()
            .where({ creator_id: creatorId, is_active: true })
            .orderBy('position', 'asc');
    }
    async getAllLinksForCreator(creatorId) {
        return await LinkModel_1.LinkModel.query()
            .where({ creator_id: creatorId })
            .orderBy('position', 'asc');
    }
    async getMaxPosition(creatorId) {
        const result = await LinkModel_1.LinkModel.query()
            .where({ creator_id: creatorId })
            .max('position as maxPosition')
            .first();
        return result?.maxPosition || 0;
    }
}
exports.LinkRepository = new LinkRepositoryClass();
//# sourceMappingURL=LinkRepository.js.map