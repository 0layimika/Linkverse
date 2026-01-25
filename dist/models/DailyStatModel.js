"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DailyStatModel = void 0;
const objection_1 = require("objection");
const CreatorModel_1 = require("./CreatorModel");
const LinkModel_1 = require("./LinkModel");
class DailyStatModel extends objection_1.Model {
    static get jsonSchema() {
        return {
            type: "object",
            required: ["creator_id", "date"],
            properties: {
                id: { type: "integer" },
                creator_id: { type: "integer" },
                link_id: { type: ["integer", "null"] },
                date: { type: "string", format: "date" },
                view_count: { type: "integer" },
                click_count: { type: "integer" },
                unique_visitors: { type: "integer" },
            },
        };
    }
    static get relationMappings() {
        return {
            creator: {
                relation: objection_1.Model.BelongsToOneRelation,
                modelClass: CreatorModel_1.CreatorModel,
                join: {
                    from: "daily_stats.creator_id",
                    to: "creators.id",
                },
            },
            link: {
                relation: objection_1.Model.BelongsToOneRelation,
                modelClass: LinkModel_1.LinkModel,
                join: {
                    from: "daily_stats.link_id",
                    to: "links.id",
                },
            },
        };
    }
}
exports.DailyStatModel = DailyStatModel;
DailyStatModel.tableName = "daily_stats";
//# sourceMappingURL=DailyStatModel.js.map