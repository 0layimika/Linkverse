import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable("creators", (table) => {
        table.string("bio").notNullable().defaultTo("Content Creator")
    })
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable("creators", (table) => {
        table.dropColumn("bio");
    })
}

