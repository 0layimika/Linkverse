import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    if (!(await knex.schema.hasColumn("store_orders", "expires_at"))) {
        await knex.schema.alterTable("store_orders", (table) => table.timestamp("expires_at").nullable());
    }
    await knex.raw(`ALTER TABLE store_orders DROP CONSTRAINT IF EXISTS store_orders_status_check`);
    await knex.raw(`ALTER TABLE store_orders ADD CONSTRAINT store_orders_status_check CHECK (status IN ('pending','paid','processing','shipped','delivered','failed','refunded','cancelled','expired'))`);
    await knex.raw(`CREATE INDEX IF NOT EXISTS store_orders_pending_expiry_idx ON store_orders (expires_at) WHERE status = 'pending'`);
}

export async function down(knex: Knex): Promise<void> {
    await knex.raw(`DROP INDEX IF EXISTS store_orders_pending_expiry_idx`);
    await knex.raw(`ALTER TABLE store_orders DROP CONSTRAINT IF EXISTS store_orders_status_check`);
    await knex.raw(`ALTER TABLE store_orders ADD CONSTRAINT store_orders_status_check CHECK (status IN ('pending','paid','processing','shipped','delivered','failed','refunded','cancelled'))`);
    if (await knex.schema.hasColumn("store_orders", "expires_at")) {
        await knex.schema.alterTable("store_orders", (table) => table.dropColumn("expires_at"));
    }
}
