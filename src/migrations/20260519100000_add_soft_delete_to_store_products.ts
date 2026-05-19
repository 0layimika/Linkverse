import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable("store_products", (table) => {
        table.timestamp("deleted_at").nullable().index();
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable("store_products", (table) => {
        table.dropColumn("deleted_at");
    });
}
