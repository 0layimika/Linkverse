import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("profile_config", (table) => {
        table.increments("id").primary();
        table
            .integer("creator_id")
            .unsigned()
            .notNullable()
            .unique()
            .references("id")
            .inTable("creators")
            .onDelete("CASCADE");
        table.string("background_type", 20).notNullable().defaultTo("color");
        table.string("background_value").nullable();
        table.string("text_color", 20).nullable();
        table.timestamps(true, true);
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists("profile_config");
}
