import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable("store_orders", (table) => {
        table.bigInteger("amount_minor").nullable();
    });

    await knex.schema.alterTable("service_bookings", (table) => {
        table.string("hold_token").nullable();
    });

    await knex.schema.raw(`
        UPDATE store_orders
        SET amount_minor = amount * 100
        WHERE amount_minor IS NULL
    `);

    await knex.schema.raw(`
        CREATE UNIQUE INDEX IF NOT EXISTS service_bookings_hold_token_unique
        ON service_bookings(hold_token)
        WHERE hold_token IS NOT NULL
    `);

    await knex.schema.raw(`
        CREATE UNIQUE INDEX IF NOT EXISTS service_bookings_unique_active
        ON service_bookings(service_id, slot_start, slot_end)
        WHERE status IN ('hold', 'confirmed')
    `);
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.raw(`DROP INDEX IF EXISTS service_bookings_hold_token_unique`);
    await knex.schema.raw(`DROP INDEX IF EXISTS service_bookings_unique_active`);

    await knex.schema.alterTable("service_bookings", (table) => {
        table.dropColumn("hold_token");
    });

    await knex.schema.alterTable("store_orders", (table) => {
        table.dropColumn("amount_minor");
    });
}
