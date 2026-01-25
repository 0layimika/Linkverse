"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    return knex.schema.alterTable("users", (table) => {
        table.boolean("verified").defaultTo(false);
    });
}
async function down(knex) {
    return knex.schema.alterTable("users", (table) => {
        table.dropColumn("verified");
    });
}
//# sourceMappingURL=20260112125311_alter_user_table_add_verified_field.js.map