import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('withdrawal_quotes', (table) => {
        table.string('id').primary();
        table.integer('creator_id').notNullable().references('id').inTable('creators').onDelete('RESTRICT');
        table.integer('wallet_id').notNullable().references('id').inTable('wallets').onDelete('RESTRICT');
        table.integer('bank_account_id').notNullable().references('id').inTable('bank_accounts').onDelete('RESTRICT');
        table.jsonb('bank_snapshot').notNullable();
        table.string('recipient_code').notNullable();
        table.string('payout_email').nullable();
        table.string('provider').notNullable();
        table.string('currency').notNullable();
        table.decimal('amount', 15, 2).notNullable();
        table.decimal('fee', 15, 2).notNullable();
        table.decimal('total_debit', 15, 2).notNullable();
        table.decimal('receive_amount', 15, 2).notNullable();
        table.string('receive_currency').notNullable().defaultTo('NGN');
        table.string('exchange_rate').nullable();
        table.string('provider_quote_id').nullable();
        table.jsonb('provider_quote').nullable();
        table.timestamp('expires_at', { useTz: true }).notNullable();
        table.enum('status', ['quoted', 'submitting', 'submitted', 'completed', 'failed', 'expired']).notNullable().defaultTo('quoted');
        table.string('reference').notNullable().unique();
        table.integer('transaction_id').nullable().unique().references('id').inTable('transactions').onDelete('RESTRICT');
        table.integer('fee_transaction_id').nullable().references('id').inTable('transactions').onDelete('RESTRICT');
        table.string('submission_state').notNullable().defaultTo('prepared');
        table.integer('attempts').notNullable().defaultTo(0);
        table.timestamp('first_submitted_at', { useTz: true }).nullable();
        table.timestamp('lease_expires_at', { useTz: true }).nullable();
        table.timestamp('next_reconcile_at', { useTz: true }).nullable();
        table.string('provider_payout_id').nullable();
        table.jsonb('provider_payout').nullable();
        table.text('error_message').nullable();
        table.timestamps(true, true);
        table.index(['creator_id', 'created_at']);
        table.index(['status', 'next_reconcile_at']);
        table.index(['expires_at']);
    });
}

export async function down(knex: Knex): Promise<void> {
    // Do not discard the durable payout/recovery record for an executed quote.
    const used = await knex('withdrawal_quotes').whereNotNull('transaction_id').first();
    if (used) throw new Error('Cannot remove withdrawal quotes containing withdrawal accounting history');
    await knex.schema.dropTable('withdrawal_quotes');
}
