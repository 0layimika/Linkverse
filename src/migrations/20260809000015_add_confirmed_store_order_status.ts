import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.raw(`ALTER TABLE store_orders DROP CONSTRAINT IF EXISTS store_orders_status_check`);
    await knex.raw(`
        ALTER TABLE store_orders
        ADD CONSTRAINT store_orders_status_check
        CHECK (status IN ('pending','paid','confirmed','processing','shipped','delivered','failed','refunded','cancelled','expired'))
    `);
}

export async function down(knex: Knex): Promise<void> {
    await knex("store_orders").where({ status: "confirmed" }).update({ status: "processing" });
    await knex.raw(`ALTER TABLE store_orders DROP CONSTRAINT IF EXISTS store_orders_status_check`);
    await knex.raw(`
        ALTER TABLE store_orders
        ADD CONSTRAINT store_orders_status_check
        CHECK (status IN ('pending','paid','processing','shipped','delivered','failed','refunded','cancelled','expired'))
    `);
}
