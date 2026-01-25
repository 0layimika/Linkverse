"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    await knex.schema.createTable("click_events", (table) => {
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
            .onDelete("SET NULL");
        table.string("event_type", 20).notNullable();
        table.string("ip_hash", 64).notNullable();
        table.text("user_agent").nullable();
        table.text("referrer").nullable();
        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.index(["creator_id", "event_type"]);
        table.index(["link_id"]);
        table.index(["created_at"]);
    });
}
async function down(knex) {
    await knex.schema.dropTableIfExists("click_events");
}
//# sourceMappingURL=20260123200000_create_click_events_table.js.map