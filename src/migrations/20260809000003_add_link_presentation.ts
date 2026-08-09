import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable("links", (table) => {
        table.string("display_type", 16).notNullable().defaultTo("standard");
        table.string("description", 240).nullable();
    });
    await knex.raw("ALTER TABLE links ADD CONSTRAINT links_display_type_check CHECK (display_type IN ('standard', 'featured'))");
}

export async function down(knex: Knex): Promise<void> {
    await knex.raw("ALTER TABLE links DROP CONSTRAINT IF EXISTS links_display_type_check");
    await knex.schema.alterTable("links", (table) => {
        table.dropColumn("display_type");
        table.dropColumn("description");
    });
}
