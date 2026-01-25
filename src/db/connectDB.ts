import knex from './knex';

export const connectDB = async () => {
    try {
        // In serverless, we check if the pool is already initialized
        // This prevents the "hanging" effect
        await knex.raw('SELECT 1');
        console.log('✅ Database connected successfully');
    } catch (err) {
        console.error('❌ Database connection failed:', err);
        // DO NOT use process.exit(1) here.
        // Throwing the error allows your index.ts try/catch to handle it gracefully.
        throw new Error('Database connection failed');
    }
};