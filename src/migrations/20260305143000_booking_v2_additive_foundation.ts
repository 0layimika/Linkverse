import type { Knex } from "knex";

const POLICY_TEMPLATE_TABLE = "booking_policy_templates";
const REFUND_TABLE = "booking_refunds";
const IDEMPOTENCY_TABLE = "booking_idempotency_keys";
const IDENTITY_MAP_TABLE = "booking_v2_identity_map";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable(IDENTITY_MAP_TABLE, (table) => {
        table.increments("id").primary();
        table.string("entity_type", 40).notNullable();
        table.integer("legacy_id").unsigned().notNullable();
        table.uuid("v2_uuid").notNullable().unique();
        table.timestamps(true, true);
        table.unique(["entity_type", "legacy_id"]);
        table.index(["entity_type", "v2_uuid"]);
    });

    await knex.schema.createTable(POLICY_TEMPLATE_TABLE, (table) => {
        table.uuid("id").primary();
        table.integer("creator_id").unsigned().notNullable()
            .references("id").inTable("creators").onDelete("CASCADE");
        table.string("name", 120).nullable();
        table.jsonb("reschedule").notNullable();
        table.jsonb("cancellation").notNullable();
        table.jsonb("no_show").notNullable();
        table.jsonb("vendor_cancellation").notNullable();
        table.boolean("is_default").notNullable().defaultTo(false);
        table.timestamps(true, true);
        table.index(["creator_id", "is_default"]);
    });

    await knex.schema.createTable(REFUND_TABLE, (table) => {
        table.uuid("id").primary();
        table.integer("order_id").unsigned().notNullable()
            .references("id").inTable("store_orders").onDelete("CASCADE");
        table.integer("booking_id").unsigned().nullable()
            .references("id").inTable("service_bookings").onDelete("SET NULL");
        table.string("currency", 3).notNullable();
        table.integer("amount_minor").notNullable();
        table.enu("method", ["provider_refund", "wallet_payout"]).notNullable();
        table.enu("status", ["PENDING", "PROCESSING", "SUCCEEDED", "FAILED"]).notNullable().defaultTo("PENDING");
        table.string("provider_refund_reference").nullable();
        table.string("failure_reason", 500).nullable();
        table.integer("attempt_count").notNullable().defaultTo(0);
        table.timestamp("next_retry_at").nullable();
        table.timestamp("last_attempt_at").nullable();
        table.timestamps(true, true);
        table.index(["order_id", "status"]);
        table.index(["status", "next_retry_at"]);
    });

    await knex.schema.createTable(IDEMPOTENCY_TABLE, (table) => {
        table.increments("id").primary();
        table.string("scope", 80).notNullable();
        table.string("idempotency_key", 140).notNullable();
        table.string("request_hash", 200).nullable();
        table.string("resource_type", 80).nullable();
        table.string("resource_id", 120).nullable();
        table.jsonb("response_snapshot").nullable();
        table.timestamp("expires_at").nullable();
        table.timestamps(true, true);
        table.unique(["scope", "idempotency_key"]);
    });

    await knex.schema.alterTable("service_bookings", (table) => {
        table.string("status_v2", 40).nullable();
        table.string("booking_timezone_snapshot", 100).nullable();
        table.jsonb("service_snapshot").nullable();
        table.jsonb("policy_snapshot").nullable();
        table.string("delivery_mode", 20).nullable();
        table.jsonb("location_snapshot").nullable();
        table.jsonb("pricing_snapshot").nullable();
        table.jsonb("buyer_snapshot").nullable();
        table.integer("reschedule_count").notNullable().defaultTo(0);
        table.string("manage_token_hash", 160).nullable();
        table.timestamp("manage_token_expires_at").nullable();
        table.timestamp("conflict_resolution_due_at").nullable();
        table.string("hold_binding_hash", 160).nullable();
        table.timestamp("hold_consumed_at").nullable();
    });

    await knex.schema.alterTable("store_orders", (table) => {
        table.string("status_v2", 40).nullable();
        table.string("idempotency_key", 140).nullable();
        table.timestamp("paid_at").nullable();
        table.integer("refunded_minor").notNullable().defaultTo(0);
        table.uuid("booking_v2_uuid").nullable();
    });

    await knex.schema.raw(`CREATE UNIQUE INDEX IF NOT EXISTS store_orders_provider_reference_unique_not_null ON store_orders(provider_reference) WHERE provider_reference IS NOT NULL`);
    await knex.schema.raw(`CREATE INDEX IF NOT EXISTS service_bookings_status_hold_expiry_idx ON service_bookings(status, hold_expires_at)`);
    await knex.schema.raw(`CREATE INDEX IF NOT EXISTS service_bookings_status_v2_idx ON service_bookings(status_v2)`);
    await knex.schema.raw(`CREATE INDEX IF NOT EXISTS service_bookings_slot_span_idx ON service_bookings(service_id, slot_start, slot_end)`);
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.raw(`DROP INDEX IF EXISTS service_bookings_slot_span_idx`);
    await knex.schema.raw(`DROP INDEX IF EXISTS service_bookings_status_v2_idx`);
    await knex.schema.raw(`DROP INDEX IF EXISTS service_bookings_status_hold_expiry_idx`);
    await knex.schema.raw(`DROP INDEX IF EXISTS store_orders_provider_reference_unique_not_null`);

    await knex.schema.alterTable("store_orders", (table) => {
        table.dropColumn("booking_v2_uuid");
        table.dropColumn("refunded_minor");
        table.dropColumn("paid_at");
        table.dropColumn("idempotency_key");
        table.dropColumn("status_v2");
    });

    await knex.schema.alterTable("service_bookings", (table) => {
        table.dropColumn("conflict_resolution_due_at");
        table.dropColumn("manage_token_expires_at");
        table.dropColumn("manage_token_hash");
        table.dropColumn("hold_consumed_at");
        table.dropColumn("hold_binding_hash");
        table.dropColumn("reschedule_count");
        table.dropColumn("buyer_snapshot");
        table.dropColumn("pricing_snapshot");
        table.dropColumn("location_snapshot");
        table.dropColumn("delivery_mode");
        table.dropColumn("policy_snapshot");
        table.dropColumn("service_snapshot");
        table.dropColumn("booking_timezone_snapshot");
        table.dropColumn("status_v2");
    });

    await knex.schema.dropTableIfExists(IDEMPOTENCY_TABLE);
    await knex.schema.dropTableIfExists(REFUND_TABLE);
    await knex.schema.dropTableIfExists(POLICY_TEMPLATE_TABLE);
    await knex.schema.dropTableIfExists(IDENTITY_MAP_TABLE);
}
