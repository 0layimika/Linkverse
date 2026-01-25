import { DATABASE_URL } from '../config/env';

const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;

export default {
    development: {
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
    },
};
