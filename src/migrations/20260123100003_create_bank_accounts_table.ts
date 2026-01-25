import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("bank_accounts", (table) => {
        table.increments("id").primary();
        table
            .integer("creator_id")
            .unsigned()
            .unique()
            .notNullable()
            .references("id")
            .inTable("creators")
            .onDelete("CASCADE");
        table.string("account_number").notNullable();
        table.string("account_name").notNullable();
        table.string("bank_code").notNullable();
        table.string("bank_name").notNullable();
        table.string("recipient_code").nullable(); // Paystack/Kora transfer recipient code
        table.string("provider").nullable(); // which provider the recipient_code is for
        table.timestamps(true, true);
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists("bank_accounts");
}
