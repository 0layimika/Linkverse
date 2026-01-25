"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    await knex.schema.createTable("daily_stats", (table) => {
        table.increments("id").primary();
        table
            .integer("creator_id")
            .unsigned()
            .notNullable()
            .references("id")
            .inTable("creators")
            .onDelete("CASCADE");
        table
            .integer("link_id")
            .unsigned()
            .nullable()
            .references("id")
            .inTable("links")
            .onDelete("CASCADE");
        table.date("date").notNullable();
        table.integer("view_count").notNullable().defaultTo(0);
        table.integer("click_count").notNullable().defaultTo(0);
        table.integer("unique_visitors").notNullable().defaultTo(0);
        table.unique(["creator_id", "link_id", "date"]);
        table.index(["creator_id", "date"]);
        table.index(["link_id", "date"]);
    });
}
async function down(knex) {
    await knex.schema.dropTableIfExists("daily_stats");
}
//# sourceMappingURL=20260123200001_create_daily_stats_table.js.map