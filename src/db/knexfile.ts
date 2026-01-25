import { DATABASE_URL } from '../config/env';

export default {
    development: {
        client: 'pg',
        connection: DATABASE_URL,
        migrations: {
            directory: '../migrations',
        },
        seeds: {
            directory: '../seeds',
        },
    },
};
