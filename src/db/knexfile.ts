import 'dotenv/config';
export default {
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
