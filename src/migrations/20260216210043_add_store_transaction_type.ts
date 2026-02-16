import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.raw(`
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1
                FROM pg_attribute a
                JOIN pg_class c ON c.oid = a.attrelid
                WHERE c.relname = 'transactions'
                AND a.attname = 'type'
            ) THEN
                IF (SELECT t.typtype
                    FROM pg_type t
                    JOIN pg_attribute a ON a.atttypid = t.oid
                    JOIN pg_class c ON c.oid = a.attrelid
                    WHERE c.relname = 'transactions'
                    AND a.attname = 'type'
                ) <> 'e' THEN
                    RETURN;
                END IF;

                PERFORM 1
                FROM pg_enum e
                WHERE e.enumlabel = 'store'
                AND e.enumtypid = (
                    SELECT a.atttypid
                    FROM pg_attribute a
                    JOIN pg_class c ON c.oid = a.attrelid
                    WHERE c.relname = 'transactions'
                    AND a.attname = 'type'
                );

                IF NOT FOUND THEN
                    EXECUTE format(
                        'ALTER TYPE %s ADD VALUE %L',
                        (
                            SELECT a.atttypid::regtype
                            FROM pg_attribute a
                            JOIN pg_class c ON c.oid = a.attrelid
                            WHERE c.relname = 'transactions'
                            AND a.attname = 'type'
                        ),
                        'store'
                    );
                END IF;
            END IF;
        END
        $$;
    `);
}

export async function down(_knex: Knex): Promise<void> {
    // No safe down migration for enum value removal
}
