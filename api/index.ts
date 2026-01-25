import 'dotenv/config';
import app from '../src/app';
import serverless from 'serverless-http';
import { connectDB } from '../src/db/connectDB';

app.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    return res.sendStatus(200);
});
// Connect to DB at startup
connectDB().then(() => {
    console.log("✅ Database connected");
}).catch(err => {
    console.error("DB connection failed:", err);
});

// Export Express app wrapped in serverless
export default serverless(app);
