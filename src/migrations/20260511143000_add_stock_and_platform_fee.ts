import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable("store_products", (table) => {
        table.boolean("track_inventory").notNullable().defaultTo(false);
        table.integer("stock_quantity").nullable();
    });

    await knex.schema.alterTable("store_orders", (table) => {
        table.integer("platform_fee").notNullable().defaultTo(0);
        table.integer("platform_fee_minor").notNullable().defaultTo(0);
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable("store_orders", (table) => {
        table.dropColumn("platform_fee");
        table.dropColumn("platform_fee_minor");
    });

    await knex.schema.alterTable("store_products", (table) => {
        table.dropColumn("track_inventory");
        table.dropColumn("stock_quantity");
    });
}
