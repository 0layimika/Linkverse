"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClickEventModel = void 0;
const objection_1 = require("objection");
const CreatorModel_1 = require("./CreatorModel");
const LinkModel_1 = require("./LinkModel");
class ClickEventModel extends objection_1.Model {
    static get jsonSchema() {
        return {
            type: "object",
            required: ["creator_id", "event_type", "ip_hash"],
            properties: {
                id: { type: "integer" },
                creator_id: { type: "integer" },
                link_id: { type: ["integer", "null"] },
                event_type: { type: "string", maxLength: 20 },
                ip_hash: { type: "string", maxLength: 64 },
                user_agent: { type: ["string", "null"] },
                referrer: { type: ["string", "null"] },
            },
        };
    }
    static get relationMappings() {
        return {
            creator: {
                relation: objection_1.Model.BelongsToOneRelation,
                modelClass: CreatorModel_1.CreatorModel,
                join: {
                    from: "click_events.creator_id",
                    to: "creators.id",
                },
            },
            link: {
                relation: objection_1.Model.BelongsToOneRelation,
                modelClass: LinkModel_1.LinkModel,
                join: {
                    from: "click_events.link_id",
                    to: "links.id",
                },
            },
        };
    }
}
exports.ClickEventModel = ClickEventModel;
ClickEventModel.tableName = "click_events";
//# sourceMappingURL=ClickEventModel.js.map