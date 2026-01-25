"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
exports.default = {
    development: {
        client: 'pg',
        connection: process.env.DATABASE_URL || 'postgresql://olayimika:password@localhost:5432/creatorlink',
        migrations: {
            directory: '../migrations',
        },
        seeds: {
            directory: '../seeds',
        },
    },
};
//# sourceMappingURL=knexfile.js.map