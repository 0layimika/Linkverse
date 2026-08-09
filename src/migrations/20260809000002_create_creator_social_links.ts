import type { Knex } from "knex";
import { SOCIAL_PLATFORMS } from "../utils/social-links";

const quotedPlatforms = SOCIAL_PLATFORMS.map((platform) => `'${platform}'`).join(", ");

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("creator_social_links", (table) => {
        table.increments("id").primary();
        table.integer("creator_id")
            .unsigned()
            .notNullable()
            .references("id")
            .inTable("creators")
            .onDelete("CASCADE");
        table.string("platform", 32).notNullable();
        table.text("url").notNullable();
        table.integer("position").unsigned().notNullable().defaultTo(0);
        table.boolean("is_visible").notNullable().defaultTo(true);
        table.timestamps(true, true);
        table.unique(["creator_id", "platform"]);
        table.index(["creator_id", "is_visible", "position"]);
    });

    await knex.raw(`
        ALTER TABLE creator_social_links
        ADD CONSTRAINT creator_social_links_platform_check
        CHECK (platform IN (${quotedPlatforms}))
    `);
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists("creator_social_links");
}
