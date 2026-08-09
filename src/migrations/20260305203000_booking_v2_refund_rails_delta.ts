import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    const hasRefundTable = await knex.schema.hasTable("booking_refunds");
    if (!hasRefundTable) return;

    // Support both enum-backed and text/check-backed status columns.
    await knex.schema.raw(`
DO $$
DECLARE
    status_udt text;
    con record;
BEGIN
    IF to_regclass('public.booking_refunds') IS NULL THEN
        RETURN;
    END IF;

    SELECT c.udt_name
    INTO status_udt
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = 'booking_refunds'
      AND c.column_name = 'status'
    LIMIT 1;

    IF status_udt IS NULL THEN
        RETURN;
    END IF;

    IF status_udt = 'booking_refunds_status' THEN
        BEGIN
            EXECUTE 'ALTER TYPE "booking_refunds_status" ADD VALUE IF NOT EXISTS ''NEEDS_BANK_DETAILS''';
        EXCEPTION
            WHEN duplicate_object THEN
                NULL;
        END;
    ELSE
        FOR con IN
            SELECT conname
            FROM pg_constraint
            WHERE conrelid = 'public.booking_refunds'::regclass
              AND contype = 'c'
              AND pg_get_constraintdef(oid) ILIKE '%status%'
        LOOP
            EXECUTE format('ALTER TABLE public.booking_refunds DROP CONSTRAINT IF EXISTS %I', con.conname);
        END LOOP;

        ALTER TABLE public.booking_refunds
            ADD CONSTRAINT booking_refunds_status_check
            CHECK (status IN ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'NEEDS_BANK_DETAILS'));
    END IF;
END$$;
`);

    const addColumnIfMissing = async (
        column: string,
        alter: (table: Knex.AlterTableBuilder) => void
    ) => {
        const hasColumn = await knex.schema.hasColumn("booking_refunds", column);
        if (!hasColumn) {
            await knex.schema.alterTable("booking_refunds", alter);
        }
    };

    await addColumnIfMissing("refund_token_hash", (table) => {
        table.string("refund_token_hash", 160).nullable();
    });
    await addColumnIfMissing("refund_token_expires_at", (table) => {
        table.timestamp("refund_token_expires_at").nullable();
    });
    await addColumnIfMissing("payout_bank_code_encrypted", (table) => {
        table.text("payout_bank_code_encrypted").nullable();
    });
    await addColumnIfMissing("payout_account_number_encrypted", (table) => {
        table.text("payout_account_number_encrypted").nullable();
    });
    await addColumnIfMissing("payout_account_name_encrypted", (table) => {
        table.text("payout_account_name_encrypted").nullable();
    });
    await addColumnIfMissing("payout_reference", (table) => {
        table.string("payout_reference", 140).nullable();
    });

    await knex.schema.raw(`CREATE INDEX IF NOT EXISTS booking_refunds_refund_token_hash_idx ON booking_refunds(refund_token_hash)`);
}

export async function down(knex: Knex): Promise<void> {
    const hasRefundTable = await knex.schema.hasTable("booking_refunds");
    if (!hasRefundTable) return;

    await knex.schema.raw(`DROP INDEX IF EXISTS booking_refunds_refund_token_hash_idx`);

    const dropColumnIfExists = async (column: string) => {
        const hasColumn = await knex.schema.hasColumn("booking_refunds", column);
        if (hasColumn) {
            await knex.schema.alterTable("booking_refunds", (table) => {
                table.dropColumn(column);
            });
        }
    };

    await dropColumnIfExists("payout_reference");
    await dropColumnIfExists("payout_account_name_encrypted");
    await dropColumnIfExists("payout_account_number_encrypted");
    await dropColumnIfExists("payout_bank_code_encrypted");
    await dropColumnIfExists("refund_token_expires_at");
    await dropColumnIfExists("refund_token_hash");

    // Restore baseline check constraint for text/check-backed schemas.
    await knex.schema.raw(`
DO $$
BEGIN
    IF to_regclass('public.booking_refunds') IS NULL THEN
        RETURN;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns c
        WHERE c.table_schema = 'public'
          AND c.table_name = 'booking_refunds'
          AND c.column_name = 'status'
          AND c.udt_name <> 'booking_refunds_status'
    ) THEN
        ALTER TABLE public.booking_refunds DROP CONSTRAINT IF EXISTS booking_refunds_status_check;
        ALTER TABLE public.booking_refunds
            ADD CONSTRAINT booking_refunds_status_check
            CHECK (status IN ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED'));
    END IF;
END$$;
`);
}
