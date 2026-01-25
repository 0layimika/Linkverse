"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    return knex.schema.createTable('users', (table) => {
        table.increments('id').primary();
        table.string('email').notNullable().unique();
        table.string('password_hash').notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
    });
}
async function down(knex) {
    return knex.schema.dropTableIfExists('users');
}
//# sourceMappingURL=20260112123314_create_user_table.js.map