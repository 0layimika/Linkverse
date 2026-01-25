"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    await knex.schema.createTable("creators", (table) => {
        table.increments("id").primary();
        table.string("username").unique().notNullable();
        table
            .integer("user_id")
            .unsigned()
            .references("id")
            .inTable("users")
            .onDelete("CASCADE");
        table.timestamps(true, true);
    });
}
async function down(knex) {
    await knex.schema.dropTableIfExists("creators");
}
//# sourceMappingURL=20260112153724_create_creator_table.js.map