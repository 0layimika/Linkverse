import app from './app';
import { connectDB } from "./db/connectDB";
import { PORT } from "./config/env";
import { StoreService } from "./services/store.service";
import { WithdrawalQuoteService } from './services/withdrawal-quote.service';
import { startWalletSettlementWorker } from './workers/wallet-settlement.worker';

const startServer = async () => {
    // Check DB connection first
    await connectDB();

    // Persistent deployments consume USD settlement jobs alongside the API.
    startWalletSettlementWorker();

    // Release abandoned checkout reservations without waiting for a request.
    const expiryTimer = setInterval(() => {
        StoreService.expirePendingOrders().catch((err) => console.error("Store order expiry failed", err));
    }, 60_000);
    expiryTimer.unref();

    const withdrawalTimer = setInterval(() => {
        WithdrawalQuoteService.reconcilePending().catch((err) => console.error('Withdrawal reconciliation failed', err));
    }, 60_000);
    withdrawalTimer.unref();

    // Then start server
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
};

startServer();
