import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable("store_orders", (table) => {
        table.integer("subtotal").notNullable().defaultTo(0);
        table.integer("total").notNullable().defaultTo(0);
        table.integer("item_count").notNullable().defaultTo(1);
    });

    await knex.schema.createTable("store_order_items", (table) => {
        table.increments("id").primary();
        table
            .integer("order_id")
            .unsigned()
            .notNullable()
            .references("id")
            .inTable("store_orders")
            .onDelete("CASCADE");
        table
            .integer("product_id")
            .unsigned()
            .notNullable()
            .references("id")
            .inTable("store_products")
            .onDelete("CASCADE");
        table.string("title_snapshot").notNullable();
        table.enu("type_snapshot", ["digital", "physical", "service"]).notNullable();
        table.integer("unit_price").notNullable();
        table.integer("quantity").notNullable().defaultTo(1);
        table.integer("line_total").notNullable();
        table.string("currency").notNullable().defaultTo("NGN");
        table.jsonb("metadata").nullable();
        table.timestamps(true, true);

        table.index(["order_id"]);
        table.index(["product_id"]);
    });

    await knex.schema.alterTable("store_download_tokens", (table) => {
        table.integer("product_id").unsigned().nullable();
        table
            .foreign("product_id")
            .references("id")
            .inTable("store_products")
            .onDelete("CASCADE");
    });

    await knex.schema.raw(
        "CREATE UNIQUE INDEX store_download_tokens_order_product_unique ON store_download_tokens(order_id, product_id)"
    );
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.raw("DROP INDEX IF EXISTS store_download_tokens_order_product_unique");

    await knex.schema.alterTable("store_download_tokens", (table) => {
        table.dropForeign(["product_id"]);
        table.dropColumn("product_id");
    });

    await knex.schema.dropTableIfExists("store_order_items");

    await knex.schema.alterTable("store_orders", (table) => {
        table.dropColumn("subtotal");
        table.dropColumn("total");
        table.dropColumn("item_count");
    });
}
