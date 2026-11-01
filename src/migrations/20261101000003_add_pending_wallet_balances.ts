import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable('wallets', (table) => {
        table.decimal('pending_balance', 15, 2).notNullable().defaultTo(0);
    });
    await knex.raw('ALTER TABLE wallets ADD CONSTRAINT wallets_pending_balance_nonnegative CHECK (pending_balance >= 0)');
    await knex.schema.alterTable('wallet_ledger_entries', (table) => {
        table.enum('balance_type', ['available', 'pending']).notNullable().defaultTo('available');
    });
    await knex.schema.createTable('wallet_pending_releases', (table) => {
        table.bigIncrements('id').primary();
        table.integer('wallet_id').notNullable().references('id').inTable('wallets').onDelete('RESTRICT');
        table.integer('transaction_id').notNullable().unique().references('id').inTable('transactions').onDelete('RESTRICT');
        table.decimal('amount', 15, 2).notNullable();
        table.string('currency').notNullable();
        table.enum('status', ['pending', 'released']).notNullable().defaultTo('pending');
        table.timestamp('release_at', { useTz: true }).notNullable();
        table.timestamp('released_at', { useTz: true }).nullable();
        table.timestamp('queue_checked_at', { useTz: true }).nullable();
        table.decimal('business_days', 5, 2).notNullable();
        table.string('timezone').notNullable().defaultTo('Africa/Lagos');
        table.timestamps(true, true);
        table.index(['status', 'release_at']);
        table.index(['status', 'queue_checked_at']);
        table.index(['wallet_id', 'status']);
    });
    await knex.raw(`ALTER TABLE wallet_pending_releases
        ADD CONSTRAINT wallet_pending_releases_positive CHECK (amount > 0),
        ADD CONSTRAINT wallet_pending_releases_usd CHECK (currency = 'USD')`);
}

export async function down(knex: Knex): Promise<void> {
    if (await knex('wallet_pending_releases').first()) throw new Error('Cannot discard wallet settlement accounting history');
    if (await knex('wallets').where('pending_balance', '>', 0).first()) throw new Error('Cannot discard pending wallet balances');
    await knex.schema.dropTable('wallet_pending_releases');
    await knex.schema.alterTable('wallet_ledger_entries', (table) => { table.dropColumn('balance_type'); });
    await knex.schema.alterTable('wallets', (table) => { table.dropColumn('pending_balance'); });
}
