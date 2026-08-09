import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    const hasTable = await knex.schema.hasTable("store_products");
    if (!hasTable) return;

    const hasDeletedAt = await knex.schema.hasColumn("store_products", "deleted_at");
    if (!hasDeletedAt) {
        await knex.schema.alterTable("store_products", (table) => {
            table.timestamp("deleted_at").nullable();
        });
    }

    await knex.schema.raw(`
        CREATE INDEX IF NOT EXISTS store_products_creator_deleted_idx
        ON store_products(creator_id, deleted_at)
    `);
}

export async function down(knex: Knex): Promise<void> {
    const hasTable = await knex.schema.hasTable("store_products");
    if (!hasTable) return;

    await knex.schema.raw(`DROP INDEX IF EXISTS store_products_creator_deleted_idx`);

    const hasDeletedAt = await knex.schema.hasColumn("store_products", "deleted_at");
    if (hasDeletedAt) {
        await knex.schema.alterTable("store_products", (table) => {
            table.dropColumn("deleted_at");
        });
    }
}
