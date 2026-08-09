import type { Knex } from "knex";

/** Additive migration: preserves existing NGN wallets and creates one USD wallet per creator. */
export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable("wallets");
  if (!hasTable) return;
  await knex.schema.alterTable("wallets", (table) => {
    table.dropUnique(["creator_id"]);
  });
  await knex.schema.alterTable("wallets", (table) => {
    table.unique(["creator_id", "currency"], "wallets_creator_currency_unique");
  });
  const creators = await knex("creators").select("id");
  for (const creator of creators) {
    const exists = await knex("wallets").where({ creator_id: creator.id, currency: "USD" }).first();
    if (!exists) {
      await knex("wallets").insert({ creator_id: creator.id, balance: 0, currency: "USD" });
    }
  }
}

export async function down(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable("wallets"))) return;
  await knex("wallets").where({ currency: "USD" }).del();
  await knex.schema.alterTable("wallets", (table) => {
    table.dropUnique(["creator_id", "currency"], "wallets_creator_currency_unique");
    table.unique(["creator_id"]);
  });
}
