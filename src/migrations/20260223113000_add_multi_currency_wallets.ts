import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable("creators", (table) => {
        table.string("default_wallet_currency").notNullable().defaultTo("NGN");
    });

    await knex.schema.raw(`
        UPDATE wallets
        SET currency = UPPER(currency)
        WHERE currency IS NOT NULL
    `);

    await knex.schema.raw(`
        ALTER TABLE wallets
        DROP CONSTRAINT IF EXISTS wallets_creator_id_unique
    `);

    await knex.schema.raw(`
        DROP INDEX IF EXISTS wallets_creator_id_unique
    `);

    await knex.schema.raw(`
        CREATE UNIQUE INDEX IF NOT EXISTS wallets_creator_currency_unique
        ON wallets(creator_id, currency)
    `);
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.raw(`
        DROP INDEX IF EXISTS wallets_creator_currency_unique
    `);

    await knex.schema.raw(`
        DELETE FROM wallets w
        WHERE w.currency <> 'NGN'
    `);

    await knex.schema.raw(`
        DELETE FROM wallets w
        USING wallets x
        WHERE w.creator_id = x.creator_id
          AND w.id > x.id
    `);

    await knex.schema.raw(`
        ALTER TABLE wallets
        ADD CONSTRAINT wallets_creator_id_unique UNIQUE (creator_id)
    `);

    await knex.schema.alterTable("creators", (table) => {
        table.dropColumn("default_wallet_currency");
    });
}
