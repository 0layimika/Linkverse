"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClickEventRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
const ClickEventModel_1 = require("../models/ClickEventModel");
class ClickEventRepositoryClass extends BaseRepository_1.BaseRepository {
    constructor() {
        super(ClickEventModel_1.ClickEventModel);
    }
    async hasRecentEvent(creatorId, ipHash, eventType, linkId, windowMinutes = 30) {
        const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
        const query = ClickEventModel_1.ClickEventModel.query()
            .where({ creator_id: creatorId, ip_hash: ipHash, event_type: eventType })
            .where('created_at', '>=', windowStart);
        if (linkId !== null) {
            query.where({ link_id: linkId });
        }
        else {
            query.whereNull('link_id');
        }
        const result = await query.first();
        return !!result;
    }
    async getEventsInRange(creatorId, startDate, endDate, eventType) {
        const query = ClickEventModel_1.ClickEventModel.query()
            .where({ creator_id: creatorId })
            .where('created_at', '>=', startDate)
            .where('created_at', '<=', endDate);
        if (eventType) {
            query.where({ event_type: eventType });
        }
        return await query.orderBy('created_at', 'desc');
    }
}
exports.ClickEventRepository = new ClickEventRepositoryClass();
//# sourceMappingURL=ClickEventRepository.js.map