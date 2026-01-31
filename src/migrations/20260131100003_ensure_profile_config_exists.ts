import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    const hasTable = await knex.schema.hasTable("profile_config");
    if (!hasTable) {
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

        // Seed for existing creators
        const creators = await knex("creators").select("id");
        if (creators.length > 0) {
            const inserts = creators.map((c: { id: number }) => ({
                creator_id: c.id,
                background_type: "color",
                background_value: null,
                text_color: null,
            }));
            await knex("profile_config").insert(inserts);
        }
    }
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists("profile_config");
}
