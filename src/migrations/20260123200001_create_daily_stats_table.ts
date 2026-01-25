import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
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

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists("daily_stats");
}
