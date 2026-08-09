import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("wallet_ledger_entries", (table) => {
        table.bigIncrements("id").primary();
        table.integer("wallet_id").unsigned().notNullable().references("id").inTable("wallets").onDelete("RESTRICT");
        table.integer("transaction_id").unsigned().nullable().references("id").inTable("transactions").onDelete("SET NULL");
        table.string("reference").notNullable();
        table.string("entry_type").notNullable();
        table.enum("direction", ["credit", "debit"]).notNullable();
        table.decimal("amount", 15, 2).notNullable();
        table.decimal("balance_before", 15, 2).notNullable();
        table.decimal("balance_after", 15, 2).notNullable();
        table.string("currency").notNullable();
        table.jsonb("metadata").nullable();
        table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
        table.unique(["wallet_id", "reference"]);
        table.index(["wallet_id", "created_at"]);
        table.index(["transaction_id"]);
    });

    await knex.schema.createTable("payment_webhook_events", (table) => {
        table.bigIncrements("id").primary();
        table.string("provider").notNullable();
        table.string("event_id").notNullable();
        table.string("event_type").nullable();
        table.text("signature").nullable();
        table.jsonb("payload").notNullable();
        table.enum("status", ["received", "processing", "processed", "failed"]).notNullable().defaultTo("received");
        table.integer("attempts").notNullable().defaultTo(0);
        table.text("error_message").nullable();
        table.timestamp("received_at").notNullable().defaultTo(knex.fn.now());
        table.timestamp("processed_at").nullable();
        table.unique(["provider", "event_id"]);
        table.index(["status", "received_at"]);
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists("payment_webhook_events");
    await knex.schema.dropTableIfExists("wallet_ledger_entries");
}
