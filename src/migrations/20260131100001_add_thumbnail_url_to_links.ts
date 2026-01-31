import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable("links", (table) => {
        table.string("thumbnail_url").nullable();
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable("links", (table) => {
        table.dropColumn("thumbnail_url");
    });
}
