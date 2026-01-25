import 'dotenv/config';
export default {
    development: {
        client: 'pg',
        connection: process.env.DATABASE_URL || 'postgresql://postgres:GzaBjIfXHlrbzwBHuoXfcKZUNjVATODo@switchyard.proxy.rlwy.net:42982/railway',
        migrations: {
            directory: '../migrations',
        },
        seeds: {
            directory: '../seeds',
        },
    },
};
