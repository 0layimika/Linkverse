import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    // Reset existing payout account setups so users re-create with SyncPay destination IDs.
    await knex("bank_accounts").del();
}

export async function down(_knex: Knex): Promise<void> {
    // Data deletion is irreversible.
}
