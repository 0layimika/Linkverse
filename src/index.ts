import app from './app';
import { connectDB } from "./db/connectDB";
import { PORT } from "./config/env";

const startServer = async () => {
    // Check DB connection first
    await connectDB();

    // Then start server
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
};

startServer();