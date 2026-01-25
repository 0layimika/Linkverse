"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    await knex.schema.alterTable("creators", (table) => {
        table.string("avatar_url").nullable();
    });
}
async function down(knex) {
    await knex.schema.alterTable("creators", (table) => {
        table.dropColumn("avatar_url");
    });
}
//# sourceMappingURL=20260113134034_alter_creator_table.js.map