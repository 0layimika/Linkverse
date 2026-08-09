import app from './app';
import { connectDB } from "./db/connectDB";
import { PORT } from "./config/env";
import { StoreService } from "./services/store.service";

const startServer = async () => {
    // Check DB connection first
    await connectDB();

    // Release abandoned checkout reservations without waiting for a request.
    const expiryTimer = setInterval(() => {
        StoreService.expirePendingOrders().catch((err) => console.error("Store order expiry failed", err));
    }, 60_000);
    expiryTimer.unref();

    // Then start server
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
};

startServer();
