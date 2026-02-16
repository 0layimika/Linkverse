import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("store_products", (table) => {
        table.increments("id").primary();
        table
            .integer("creator_id")
            .unsigned()
            .notNullable()
            .references("id")
            .inTable("creators")
            .onDelete("CASCADE");
        table.enu("type", ["digital", "physical", "service"]).notNullable();
        table.string("title").notNullable();
        table.text("description").nullable();
        table.integer("price").notNullable(); // in major units (e.g., naira)
        table.string("currency").notNullable().defaultTo("NGN");
        table.string("cover_url").nullable();
        table.boolean("is_active").notNullable().defaultTo(true);
        table.integer("download_limit").notNullable().defaultTo(3);

        // Digital-only fields
        table.string("file_id").nullable();
        table.string("file_url").nullable();
        table.integer("file_size").nullable();
        table.string("file_type").nullable();

        // Service-only fields
        table.integer("duration_minutes").nullable();
        table.integer("buffer_minutes").nullable();
        table.string("timezone").nullable();

        // Physical-only fields
        table.boolean("requires_address").notNullable().defaultTo(false);

        table.timestamps(true, true);
    });

    await knex.schema.createTable("store_orders", (table) => {
        table.increments("id").primary();
        table
            .integer("creator_id")
            .unsigned()
            .notNullable()
            .references("id")
            .inTable("creators")
            .onDelete("CASCADE");
        table
            .integer("product_id")
            .unsigned()
            .notNullable()
            .references("id")
            .inTable("store_products")
            .onDelete("CASCADE");
        table.string("buyer_email").notNullable();
        table.string("buyer_name").nullable();
        table.string("buyer_phone").nullable();
        table.jsonb("delivery_address").nullable();
        table
            .enu("status", ["pending", "paid", "failed", "refunded", "cancelled"])
            .notNullable()
            .defaultTo("pending");
        table.integer("amount").notNullable();
        table.string("currency").notNullable().defaultTo("NGN");
        table.string("reference").notNullable().unique();
        table.string("provider").notNullable();
        table.string("provider_reference").nullable();
        table.jsonb("metadata").nullable();
        table.timestamps(true, true);
        table.index(["creator_id", "status"]);
        table.index(["product_id"]);
    });

    await knex.schema.createTable("store_download_tokens", (table) => {
        table.increments("id").primary();
        table
            .integer("order_id")
            .unsigned()
            .notNullable()
            .references("id")
            .inTable("store_orders")
            .onDelete("CASCADE");
        table.string("token").notNullable().unique();
        table.integer("max_downloads").notNullable().defaultTo(3);
        table.integer("download_count").notNullable().defaultTo(0);
        table.timestamp("last_download_at").nullable();
        table.timestamp("revoked_at").nullable();
        table.timestamps(true, true);
    });

    await knex.schema.createTable("service_availability_windows", (table) => {
        table.increments("id").primary();
        table
            .integer("creator_id")
            .unsigned()
            .notNullable()
            .references("id")
            .inTable("creators")
            .onDelete("CASCADE");
        table.integer("weekday").notNullable(); // 0-6
        table.time("start_time").notNullable();
        table.time("end_time").notNullable();
        table.string("timezone").notNullable();
        table.timestamps(true, true);
        table.index(["creator_id", "weekday"]);
    });

    await knex.schema.createTable("service_bookings", (table) => {
        table.increments("id").primary();
        table
            .integer("service_id")
            .unsigned()
            .notNullable()
            .references("id")
            .inTable("store_products")
            .onDelete("CASCADE");
        table
            .integer("creator_id")
            .unsigned()
            .notNullable()
            .references("id")
            .inTable("creators")
            .onDelete("CASCADE");
        table
            .integer("order_id")
            .unsigned()
            .nullable()
            .references("id")
            .inTable("store_orders")
            .onDelete("SET NULL");
        table.timestamp("slot_start").notNullable();
        table.timestamp("slot_end").notNullable();
        table
            .enu("status", ["hold", "confirmed", "expired", "cancelled"])
            .notNullable()
            .defaultTo("hold");
        table.timestamp("hold_expires_at").nullable();
        table.string("buyer_email").nullable();
        table.string("buyer_name").nullable();
        table.string("buyer_phone").nullable();
        table.text("notes").nullable();
        table.timestamps(true, true);
        table.index(["creator_id", "status"]);
        table.index(["service_id", "slot_start", "slot_end"]);
    });

    await knex.schema.raw(`
        CREATE UNIQUE INDEX service_bookings_unique_active
        ON service_bookings(service_id, slot_start, slot_end)
        WHERE status IN ('hold', 'confirmed');
    `);
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.raw(`DROP INDEX IF EXISTS service_bookings_unique_active`);
    await knex.schema.dropTableIfExists("service_bookings");
    await knex.schema.dropTableIfExists("service_availability_windows");
    await knex.schema.dropTableIfExists("store_download_tokens");
    await knex.schema.dropTableIfExists("store_orders");
    await knex.schema.dropTableIfExists("store_products");
}
