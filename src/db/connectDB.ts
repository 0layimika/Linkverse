import knex from './knex';

export const connectDB = async () => {
    try {
        // Run a simple query to check connection
        await knex.raw('SELECT 1+1 AS result');
        console.log('✅ Database connected successfully');
    } catch (err) {
        console.error('❌ Database connection failed:', err);
        process.exit(1); // exit if DB is not reachable
    }
};
