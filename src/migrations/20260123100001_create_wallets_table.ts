import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("wallets", (table) => {
        table.increments("id").primary();
        table
            .integer("creator_id")
            .unsigned()
            .unique()
            .notNullable()
            .references("id")
            .inTable("creators")
            .onDelete("CASCADE");
        table.decimal("balance", 15, 2).notNullable().defaultTo(0);
        table.string("currency").notNullable().defaultTo("NGN");
        table.timestamps(true, true);
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists("wallets");
}
