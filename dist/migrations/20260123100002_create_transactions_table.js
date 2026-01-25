"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    await knex.schema.createTable("transactions", (table) => {
        table.increments("id").primary();
        table
            .integer("wallet_id")
            .unsigned()
            .notNullable()
            .references("id")
            .inTable("wallets")
            .onDelete("CASCADE");
        table.enum("type", ["gift", "withdrawal"]).notNullable();
        table.decimal("amount", 15, 2).notNullable();
        table.string("currency").notNullable().defaultTo("NGN");
        table.enum("status", ["pending", "completed", "failed"]).notNullable().defaultTo("pending");
        table.string("reference").unique().notNullable();
        table.string("provider").notNullable(); // paystack or kora
        table.string("provider_reference").nullable();
        table.string("description").nullable();
        table.string("sender_name").nullable(); // for gifts
        table.string("sender_email").nullable(); // for gifts
        table.jsonb("metadata").nullable();
        table.timestamps(true, true);
    });
}
async function down(knex) {
    await knex.schema.dropTableIfExists("transactions");
}
//# sourceMappingURL=20260123100002_create_transactions_table.js.map