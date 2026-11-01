import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    // Normalize both historical native-enum and text/check installations.
    await knex.raw(`
        ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
        ALTER TABLE transactions ALTER COLUMN type TYPE text USING type::text;
        ALTER TABLE transactions ADD CONSTRAINT transactions_type_check
            CHECK (type IN ('gift', 'withdrawal', 'store', 'fee'));
    `);
}

export async function down(knex: Knex): Promise<void> {
    // PostgreSQL rejects rollback if fee records exist, preserving accounting history.
    await knex.raw(`
        ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
        ALTER TABLE transactions ADD CONSTRAINT transactions_type_check
            CHECK (type IN ('gift', 'withdrawal', 'store'));
    `);
}
