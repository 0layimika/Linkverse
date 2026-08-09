import { Knex } from "knex";
export async function up(knex: Knex): Promise<void> { await knex.schema.alterTable("click_events", (table) => { table.string("source", 80).nullable(); table.string("medium", 80).nullable(); table.string("campaign", 120).nullable(); }); }
export async function down(knex: Knex): Promise<void> { await knex.schema.alterTable("click_events", (table) => { table.dropColumn("source"); table.dropColumn("medium"); table.dropColumn("campaign"); }); }
