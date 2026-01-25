"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    await knex.schema.createTable("links", (table) => {
        table.increments("id").primary();
        table
            .integer("creator_id")
            .unsigned()
            .notNullable()
            .references("id")
            .inTable("creators")
            .onDelete("CASCADE");
        table.string("title").notNullable();
        table.string("url").notNullable();
        table.string("icon").nullable();
        table.integer("position").notNullable().defaultTo(0);
        table.boolean("is_active").notNullable().defaultTo(true);
        table.timestamps(true, true);
    });
}
async function down(knex) {
    await knex.schema.dropTableIfExists("links");
}
//# sourceMappingURL=20260123100000_create_links_table.js.map