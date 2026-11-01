import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    // Unexecuted quotes are disposable cache entries. Preserve all actual payouts.
    await knex('withdrawal_quotes').whereNull('transaction_id').delete();
    await knex.schema.renameTable('withdrawal_quotes', 'withdrawal_payouts');
    await knex.raw(`
        ALTER TABLE withdrawal_payouts DROP CONSTRAINT IF EXISTS withdrawal_quotes_status_check;
        ALTER TABLE withdrawal_payouts ALTER COLUMN status SET DEFAULT 'submitting';
        ALTER TABLE withdrawal_payouts ALTER COLUMN transaction_id SET NOT NULL;
        ALTER TABLE withdrawal_payouts ADD CONSTRAINT withdrawal_payouts_status_check
            CHECK (status IN ('submitting', 'submitted', 'completed', 'failed'));
    `);
}

export async function down(knex: Knex): Promise<void> {
    await knex.raw(`
        ALTER TABLE withdrawal_payouts DROP CONSTRAINT withdrawal_payouts_status_check;
        ALTER TABLE withdrawal_payouts ALTER COLUMN status SET DEFAULT 'quoted';
        ALTER TABLE withdrawal_payouts ALTER COLUMN transaction_id DROP NOT NULL;
        ALTER TABLE withdrawal_payouts ADD CONSTRAINT withdrawal_quotes_status_check
            CHECK (status IN ('quoted', 'submitting', 'submitted', 'completed', 'failed', 'expired'));
    `);
    await knex.schema.renameTable('withdrawal_payouts', 'withdrawal_quotes');
}
