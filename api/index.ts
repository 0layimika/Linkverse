import 'dotenv/config';
import { app } from '../src/app';
import serverless from 'serverless-http';
import { connectDB } from '../src/db/connectDB';

// Connect to DB at startup
connectDB().then(() => {
    console.log("✅ Database connected");
}).catch(err => {
    console.error("DB connection failed:", err);
});

// Export Express app wrapped in serverless
export default serverless(app);
