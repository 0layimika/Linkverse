import 'dotenv/config';
import app from '../src/app';
import serverless from 'serverless-http';
import { connectDB } from '../src/db/connectDB';

const handler = serverless(app);

export default async (req: any, res: any) => {
    // 1. Force the DB to connect AND wait for it before moving to Express
    try {
        await connectDB();
    } catch (err) {
        console.error("DB Connection Error:", err);
        // Don't continue if DB fails
        return res.status(500).json({ error: "Database connection failed" });
    }

    // 2. Hand off to Express
    return await handler(req, res);
};