import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.raw(`
        ALTER TABLE transactions
        DROP CONSTRAINT IF EXISTS transactions_type_check;
    `);

    await knex.schema.raw(`
        ALTER TABLE transactions
        ADD CONSTRAINT transactions_type_check
        CHECK (type IN ('gift', 'withdrawal', 'store'));
    `);
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.raw(`
        ALTER TABLE transactions
        DROP CONSTRAINT IF EXISTS transactions_type_check;
    `);

    await knex.schema.raw(`
        ALTER TABLE transactions
        ADD CONSTRAINT transactions_type_check
        CHECK (type IN ('gift', 'withdrawal'));
    `);
}
