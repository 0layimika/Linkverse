import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable("profile_config", (table) => {
        table.string("support_button_text", 50).nullable().defaultTo("Support me");
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable("profile_config", (table) => {
        table.dropColumn("support_button_text");
    });
}
