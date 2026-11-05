import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.raw(`
        ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
        ALTER TABLE transactions ALTER COLUMN type TYPE text USING type::text;
        ALTER TABLE transactions ADD CONSTRAINT transactions_type_check
            CHECK (type IN ('gift', 'withdrawal', 'store', 'fee', 'admin_debit'));
    `);
    await knex.schema.createTable('admin_audit_logs', (table) => {
        table.bigIncrements('id').primary();
        table.uuid('request_id').notNullable();
        table.integer('actor_id').notNullable().references('id').inTable('users').onDelete('RESTRICT');
        table.string('action').notNullable();
        table.string('target_id').notNullable();
        table.text('reason').notNullable();
        table.jsonb('input').notNullable();
        table.jsonb('result').notNullable();
        table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
        table.unique(['actor_id', 'request_id']);
        table.index(['created_at', 'id']);
    });
}

export async function down(knex: Knex): Promise<void> {
    if (await knex('admin_audit_logs').first()) throw new Error('Cannot discard admin audit history');
    await knex.raw(`
        ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
        ALTER TABLE transactions ADD CONSTRAINT transactions_type_check
            CHECK (type IN ('gift', 'withdrawal', 'store', 'fee'));
    `);
    await knex.schema.dropTable('admin_audit_logs');
}
