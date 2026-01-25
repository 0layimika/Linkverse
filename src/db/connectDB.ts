import knex from './knex';

let isConnected = false;

export const connectDB = async () => {
    // In serverless, reuse existing connection
    if (isConnected) {
        return;
    }

    try {
        // Quick connection test with timeout
        await Promise.race([
            knex.raw('SELECT 1'),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('DB connection timeout')), 5000)
            )
        ]);
        isConnected = true;
        console.log('✅ Database connected successfully');
    } catch (err) {
        console.error('❌ Database connection failed:', err);
        isConnected = false;
        throw new Error('Database connection failed');
    }
};
