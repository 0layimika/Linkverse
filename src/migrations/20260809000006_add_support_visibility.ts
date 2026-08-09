import { Knex } from "knex";
export async function up(knex: Knex): Promise<void> { await knex.schema.alterTable("profile_config", (table) => { table.boolean("support_enabled").notNullable().defaultTo(true); }); }
export async function down(knex: Knex): Promise<void> { await knex.schema.alterTable("profile_config", (table) => { table.dropColumn("support_enabled"); }); }
