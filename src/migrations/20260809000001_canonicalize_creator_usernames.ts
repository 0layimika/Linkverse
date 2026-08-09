import type { Knex } from "knex";

async function findCanonicalCollisions(knex: Knex): Promise<Array<{ username: string; creator_ids: number[] }>> {
    const result = await knex.raw(`
        SELECT LOWER(BTRIM(username)) AS username, ARRAY_AGG(id ORDER BY id) AS creator_ids
        FROM creators
        GROUP BY LOWER(BTRIM(username))
        HAVING COUNT(*) > 1
        ORDER BY LOWER(BTRIM(username))
    `);

    return result.rows as Array<{ username: string; creator_ids: number[] }>;
}

export async function up(knex: Knex): Promise<void> {
    const collisions = await findCanonicalCollisions(knex);
    if (collisions.length > 0) {
        const summary = collisions
            .map(({ username, creator_ids }) => `"${username}" (creator ids: ${creator_ids.join(", ")})`)
            .join("; ");
        throw new Error(
            `Cannot canonicalize creators.username because case-insensitive collisions exist: ${summary}. Resolve these usernames before rerunning the migration.`,
        );
    }

    await knex.raw("UPDATE creators SET username = LOWER(BTRIM(username)) WHERE username <> LOWER(BTRIM(username))");

    await knex.raw(`
        DO $$
        DECLARE constraint_name text;
        BEGIN
            SELECT con.conname INTO constraint_name
            FROM pg_constraint con
            JOIN pg_attribute attr
                ON attr.attrelid = con.conrelid
                AND attr.attnum = con.conkey[1]
            WHERE con.conrelid = 'creators'::regclass
                AND con.contype = 'u'
                AND array_length(con.conkey, 1) = 1
                AND attr.attname = 'username'
            LIMIT 1;

            IF constraint_name IS NOT NULL THEN
                EXECUTE format('ALTER TABLE creators DROP CONSTRAINT %I', constraint_name);
            END IF;
        END $$;
    `);

    await knex.raw("DROP INDEX IF EXISTS creators_username_lower_unique");
    await knex.raw("CREATE UNIQUE INDEX creators_username_lower_unique ON creators (LOWER(username))");
    await knex.raw(`
        ALTER TABLE creators
        ADD CONSTRAINT creators_username_canonical_check
        CHECK (username = LOWER(BTRIM(username)))
    `);
}

export async function down(knex: Knex): Promise<void> {
    await knex.raw("ALTER TABLE creators DROP CONSTRAINT IF EXISTS creators_username_canonical_check");
    await knex.raw("DROP INDEX IF EXISTS creators_username_lower_unique");
    await knex.raw("ALTER TABLE creators ADD CONSTRAINT creators_username_unique UNIQUE (username)");
}
