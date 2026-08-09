import { DATABASE_URL } from '../config/env';

const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;

const config = {
    client: 'pg',
    connection: DATABASE_URL,
    pool: {
        min: isProduction ? 0 : 2,
        max: isProduction ? 1 : 10,
        idleTimeoutMillis: 30000,
        acquireTimeoutMillis: 60000,
    },
    migrations: {
        directory: '../migrations',
    },
    seeds: {
        directory: '../seeds',
    },
};

// Knex selects the config key matching NODE_ENV. Keep both environments
// explicit so `knex migrate:latest` works in Render production as well as
// local development.
export default {
    development: config,
    production: config,
};
