import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable("store_products", (table) => {
        table.integer("amount").nullable();
        table.integer("booking_fee").nullable();
        table.text("cancellation_policy").nullable();
        table.text("reschedule_policy").nullable();
        table.text("refund_policy").nullable();
        table.text("other_policies").nullable();
        table.integer("duration_seconds").nullable();
    });

    await knex("store_products").update({ amount: knex.ref("price") });
    await knex("store_products")
        .where({ type: "service" })
        .update({ booking_fee: knex.ref("price") });
    await knex("store_products")
        .whereNot({ type: "service" })
        .update({ booking_fee: 0 });

    await knex.schema.alterTable("store_products", (table) => {
        table.integer("amount").notNullable().alter();
        table.integer("booking_fee").notNullable().defaultTo(0).alter();
    });

    await knex.schema.createTable("store_booking_settings", (table) => {
        table.increments("id").primary();
        table
            .integer("creator_id")
            .unsigned()
            .notNullable()
            .references("id")
            .inTable("creators")
            .onDelete("CASCADE");
        table.string("timezone").notNullable().defaultTo("Africa/Lagos");
        table.boolean("allow_multiple_bookings").notNullable().defaultTo(false);
        table.integer("max_bookings_per_slot").notNullable().defaultTo(1);
        table.boolean("allow_reschedule").notNullable().defaultTo(false);
        table.text("default_cancellation_policy").nullable();
        table.text("default_reschedule_policy").nullable();
        table.text("default_refund_policy").nullable();
        table.text("default_other_policies").nullable();
        table.timestamps(true, true);

        table.unique(["creator_id"]);
    });

    await knex.schema.createTable("creator_time_off", (table) => {
        table.increments("id").primary();
        table
            .integer("creator_id")
            .unsigned()
            .notNullable()
            .references("id")
            .inTable("creators")
            .onDelete("CASCADE");
        table.timestamp("start_at").notNullable();
        table.timestamp("end_at").notNullable();
        table.text("notes").nullable();
        table.timestamps(true, true);

        table.index(["creator_id", "start_at", "end_at"]);
    });

    await knex.schema.createTable("booking_requests", (table) => {
        table.increments("id").primary();
        table
            .integer("booking_id")
            .unsigned()
            .notNullable()
            .references("id")
            .inTable("service_bookings")
            .onDelete("CASCADE");
        table
            .integer("order_id")
            .unsigned()
            .nullable()
            .references("id")
            .inTable("store_orders")
            .onDelete("SET NULL");
        table
            .integer("creator_id")
            .unsigned()
            .notNullable()
            .references("id")
            .inTable("creators")
            .onDelete("CASCADE");
        table.enu("request_type", ["reschedule", "cancellation"]).notNullable();
        table.enu("status", ["pending", "approved", "rejected", "processed"]).notNullable().defaultTo("pending");
        table.timestamp("requested_slot_start").nullable();
        table.timestamp("requested_slot_end").nullable();
        table.text("reason").nullable();
        table.string("customer_name").nullable();
        table.string("customer_email").nullable();
        table.string("customer_phone").nullable();
        table.text("customer_notes").nullable();
        table.string("refund_account_number").nullable();
        table.string("refund_account_name").nullable();
        table.string("refund_bank_code").nullable();
        table.string("refund_bank_name").nullable();
        table.integer("refund_amount").nullable();
        table.string("refund_currency").notNullable().defaultTo("NGN");
        table.text("owner_response").nullable();
        table.timestamp("processed_at").nullable();
        table.jsonb("metadata").nullable();
        table.timestamps(true, true);

        table.index(["creator_id", "status", "request_type"]);
        table.index(["booking_id"]);
    });

    await knex.schema.raw(`DROP INDEX IF EXISTS service_bookings_unique_active`);
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.raw(`
        CREATE UNIQUE INDEX IF NOT EXISTS service_bookings_unique_active
        ON service_bookings(service_id, slot_start, slot_end)
        WHERE status IN ('hold', 'confirmed')
    `);

    await knex.schema.dropTableIfExists("booking_requests");
    await knex.schema.dropTableIfExists("creator_time_off");
    await knex.schema.dropTableIfExists("store_booking_settings");

    await knex.schema.alterTable("store_products", (table) => {
        table.dropColumn("duration_seconds");
        table.dropColumn("other_policies");
        table.dropColumn("refund_policy");
        table.dropColumn("reschedule_policy");
        table.dropColumn("cancellation_policy");
        table.dropColumn("booking_fee");
        table.dropColumn("amount");
    });
}
