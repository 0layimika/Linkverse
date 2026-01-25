import 'dotenv/config';
import app from '../src/app';
import serverless from 'serverless-http';
import { connectDB } from '../src/db/connectDB';

// Cache the handler and DB connection
let cachedHandler: any = null;
let dbConnected = false;

const getHandler = async () => {
    if (cachedHandler) {
        return cachedHandler;
    }

    // Connect to DB once (connection is cached by knex)
    if (!dbConnected) {
        try {
            await connectDB();
            dbConnected = true;
        } catch (err) {
            console.error("DB Connection Error:", err);
            throw err;
        }
    }

    // Create handler once
    cachedHandler = serverless(app, {
        binary: ['image/*', 'application/pdf'],
    });

    return cachedHandler;
};

export default async (req: any, res: any) => {
    try {
        const handler = await getHandler();
        return await handler(req, res);
    } catch (err: any) {
        console.error("Handler Error:", err);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNALERROR',
                message: err.message || 'Internal server error'
            }
        });
    }
};