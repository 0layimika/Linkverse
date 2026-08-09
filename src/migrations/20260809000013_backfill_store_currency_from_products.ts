import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const creators = await knex("creators").select("id");
  for (const creator of creators) {
    const currencies = await knex("store_products").where({ creator_id: creator.id }).distinct("currency");
    if (currencies.length === 1 && ["NGN", "USD"].includes(String(currencies[0].currency).toUpperCase())) {
      await knex("creators").where({ id: creator.id }).update({ store_currency: String(currencies[0].currency).toUpperCase() });
    }
  }
}

export async function down(_knex: Knex): Promise<void> {}
