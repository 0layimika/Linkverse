import type { Knex } from "knex";

/**
 * Repairs databases where the original expiry migration was recorded but the
 * column was not present (for example, after an interrupted deploy).
 */
export async function up(knex: Knex): Promise<void> {
    if (!(await knex.schema.hasTable("store_orders"))) return;

    if (!(await knex.schema.hasColumn("store_orders", "expires_at"))) {
        await knex.schema.alterTable("store_orders", (table) => {
            table.timestamp("expires_at").nullable();
        });
    }

    await knex.raw(
        "CREATE INDEX IF NOT EXISTS store_orders_pending_expiry_idx ON store_orders (expires_at) WHERE status = 'pending'",
    );
}

export async function down(knex: Knex): Promise<void> {
    await knex.raw("DROP INDEX IF EXISTS store_orders_pending_expiry_idx");
}
