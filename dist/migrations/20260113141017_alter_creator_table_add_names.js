"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    await knex.schema.alterTable("creators", (table) => {
        table.string("first_name").notNullable().defaultTo("guest");
        table.string("last_name").notNullable().defaultTo("user");
    });
}
async function down(knex) {
    await knex.schema.alterTable("creators", (table) => {
        table.dropColumn("first_name");
        table.dropColumn("last_name");
    });
}
//# sourceMappingURL=20260113141017_alter_creator_table_add_names.js.map