"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    await knex.schema.alterTable("creators", (table) => {
        table.string("bio").notNullable().defaultTo("Content Creator");
    });
}
async function down(knex) {
    await knex.schema.alterTable("creators", (table) => {
        table.dropColumn("bio");
    });
}
//# sourceMappingURL=20260113141948_add_bio_to_creator.js.map