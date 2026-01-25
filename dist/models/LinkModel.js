"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkModel = void 0;
const objection_1 = require("objection");
const CreatorModel_1 = require("./CreatorModel");
class LinkModel extends objection_1.Model {
    static get jsonSchema() {
        return {
            type: "object",
            required: ["creator_id", "title", "url"],
            properties: {
                id: { type: "integer" },
                creator_id: { type: "integer" },
                title: { type: "string", minLength: 1, maxLength: 100 },
                url: { type: "string", minLength: 1 },
                icon: { type: ["string", "null"] },
                position: { type: "integer" },
                is_active: { type: "boolean" },
            },
        };
    }
    static get relationMappings() {
        return {
            creator: {
                relation: objection_1.Model.BelongsToOneRelation,
                modelClass: CreatorModel_1.CreatorModel,
                join: {
                    from: "links.creator_id",
                    to: "creators.id",
                },
            },
        };
    }
}
exports.LinkModel = LinkModel;
LinkModel.tableName = "links";
//# sourceMappingURL=LinkModel.js.map