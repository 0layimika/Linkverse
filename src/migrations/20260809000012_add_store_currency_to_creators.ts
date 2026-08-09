import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasColumn("creators", "store_currency"))) {
    await knex.schema.alterTable("creators", (table) => table.string("store_currency", 3).notNullable().defaultTo("NGN"));
  }
  await knex("creators").whereNull("store_currency").update({ store_currency: "NGN" });
}

export async function down(knex: Knex): Promise<void> {
  if (await knex.schema.hasColumn("creators", "store_currency")) await knex.schema.alterTable("creators", (table) => table.dropColumn("store_currency"));
}
