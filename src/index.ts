import 'dotenv/config';
import { app } from './app';
import {connectDB} from "./db/connectDB";
const PORT = process.env.PORT || 8010;

const startServer = async () => {
    // Check DB connection first
    await connectDB();

    // Then start server
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
};

startServer();