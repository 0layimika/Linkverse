"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
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
async function down(knex) {
    await knex.schema.dropTableIfExists("wallets");
}
//# sourceMappingURL=20260123100001_create_wallets_table.js.map