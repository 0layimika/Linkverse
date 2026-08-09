import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable("store_products");
  if (!hasTable) return;

  const hasMobileTransportFee = await knex.schema.hasColumn("store_products", "mobile_transport_fee");
  const hasPassPlatformFee = await knex.schema.hasColumn("store_products", "pass_platform_fee_to_buyer");

  await knex.schema.alterTable("store_products", (table) => {
    if (!hasMobileTransportFee) {
      table.integer("mobile_transport_fee").notNullable().defaultTo(0);
    }
    if (!hasPassPlatformFee) {
      table.boolean("pass_platform_fee_to_buyer").notNullable().defaultTo(false);
    }
  });
}

export async function down(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable("store_products");
  if (!hasTable) return;

  const hasMobileTransportFee = await knex.schema.hasColumn("store_products", "mobile_transport_fee");
  const hasPassPlatformFee = await knex.schema.hasColumn("store_products", "pass_platform_fee_to_buyer");

  await knex.schema.alterTable("store_products", (table) => {
    if (hasPassPlatformFee) {
      table.dropColumn("pass_platform_fee_to_buyer");
    }
    if (hasMobileTransportFee) {
      table.dropColumn("mobile_transport_fee");
    }
  });
}
