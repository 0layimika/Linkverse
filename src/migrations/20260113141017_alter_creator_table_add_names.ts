import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable("creators", (table) => {
        table.string("first_name").notNullable().defaultTo("guest")
        table.string("last_name").notNullable().defaultTo("user")
    })
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable("creators", (table) => {
        table.dropColumn("first_name");
        table.dropColumn("last_name");
    })
}

