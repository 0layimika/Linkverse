import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  for (const [table, columns] of Object.entries({
    store_products: ["price", "compare_at_price"],
    store_orders: ["amount", "subtotal", "total", "platform_fee"],
    store_order_items: ["unit_price", "line_total"],
  })) {
    if (!(await knex.schema.hasTable(table))) continue;
    await knex.schema.alterTable(table, (t) => {
      for (const column of columns) t.decimal(column, 15, 2).alter();
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  // Major-unit decimals are required for USD cents; do not silently truncate on rollback.
  void knex;
}
