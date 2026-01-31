import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    const creators = await knex("creators").select("id");
    const existingConfigCreatorIds = await knex("profile_config")
        .select("creator_id")
        .then((rows) => rows.map((r) => r.creator_id));

    const creatorIdsToInsert = creators
        .map((c) => c.id)
        .filter((id) => !existingConfigCreatorIds.includes(id));

    if (creatorIdsToInsert.length === 0) {
        return;
    }

    const inserts = creatorIdsToInsert.map((creator_id) => ({
        creator_id,
        background_type: "color",
        background_value: null,
        text_color: null,
    }));

    await knex("profile_config").insert(inserts);
}

export async function down(knex: Knex): Promise<void> {
    // Remove profile_configs that were seeded (have default color type and null values)
    // This is conservative - we only remove rows that look like defaults
    await knex("profile_config")
        .where({
            background_type: "color",
            background_value: null,
            text_color: null,
        })
        .delete();
}
