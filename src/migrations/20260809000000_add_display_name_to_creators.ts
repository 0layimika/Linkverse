import type { Knex } from "knex";

/**
 * Additive and nullable by design: existing creators continue to use their
 * first/last name or username until they explicitly choose a display name.
 */
export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable("creators", (table) => {
        table.string("display_name", 80).nullable();
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable("creators", (table) => {
        table.dropColumn("display_name");
    });
}
