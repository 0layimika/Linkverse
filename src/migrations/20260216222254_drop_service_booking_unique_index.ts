import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.raw(`DROP INDEX IF EXISTS service_bookings_unique_active`);
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.raw(`
        CREATE UNIQUE INDEX IF NOT EXISTS service_bookings_unique_active
        ON service_bookings(service_id, slot_start, slot_end)
        WHERE status IN ('hold', 'confirmed');
    `);
}
