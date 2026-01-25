import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
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

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists("click_events");
}
