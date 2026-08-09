import type { Knex } from "knex";

/** Additive store fields. Legacy product types/records remain untouched. */
export async function up(knex: Knex): Promise<void> {
    const hasCompare = await knex.schema.hasColumn("store_products", "compare_at_price");
    if (!hasCompare) {
        await knex.schema.alterTable("store_products", (table) => {
            table.integer("compare_at_price").nullable();
        });
    }

    // Knex's postgres enum emulation is a CHECK constraint in this project.
    // Replace it additively so existing orders remain valid while fulfilment
    // states can move from paid -> processing -> shipped -> delivered.
    await knex.raw(`
      DO $$
      DECLARE constraint_name text;
      BEGIN
        SELECT conname INTO constraint_name
        FROM pg_constraint
        WHERE conrelid = 'store_orders'::regclass
          AND contype = 'c'
          AND pg_get_constraintdef(oid) LIKE '%status%';
        IF constraint_name IS NOT NULL THEN
          EXECUTE format('ALTER TABLE store_orders DROP CONSTRAINT %I', constraint_name);
        END IF;
        ALTER TABLE store_orders
          ADD CONSTRAINT store_orders_status_check
          CHECK (status IN ('pending','paid','processing','shipped','delivered','failed','refunded','cancelled'));
      END $$;
    `);
}

export async function down(knex: Knex): Promise<void> {
    await knex.raw(`ALTER TABLE store_orders DROP CONSTRAINT IF EXISTS store_orders_status_check`);
    await knex.raw(`ALTER TABLE store_orders ADD CONSTRAINT store_orders_status_check CHECK (status IN ('pending','paid','failed','refunded','cancelled'))`);
    if (await knex.schema.hasColumn("store_products", "compare_at_price")) {
        await knex.schema.alterTable("store_products", (table) => table.dropColumn("compare_at_price"));
    }
}
