import { Worker } from 'bullmq';
import knex from '../db/knex';
import { connectDB } from '../db/connectDB';
import { WalletPendingBalanceService } from '../services/wallet-pending-balance.service';
import {
    WALLET_SETTLEMENT_QUEUE, WALLET_SETTLEMENT_PREFIX, walletQueueConnection,
    closeWalletSettlementQueue, type WalletSettlementJob,
} from '../queues/wallet-settlement.queue';

export function startWalletSettlementWorker() {
    const worker = new Worker<WalletSettlementJob>(WALLET_SETTLEMENT_QUEUE, async (job) => {
        if (job.name !== 'release-usd' || !/^\d+$/.test(String(job.data.releaseId))) throw new Error('Invalid wallet settlement job');
        await WalletPendingBalanceService.release(String(job.data.releaseId));
    }, { connection: walletQueueConnection(true), prefix: WALLET_SETTLEMENT_PREFIX, concurrency: 5 });
    worker.on('error', () => console.error('USD wallet settlement worker connection error'));
    worker.on('failed', (job, err) => console.error('USD wallet settlement job failed', { jobId: job?.id, message: err.message }));

    let recovering = false;
    const recover = async () => {
        if (recovering) return;
        recovering = true;
        try { await WalletPendingBalanceService.recover(); }
        catch { console.error('USD wallet settlement recovery will retry'); }
        finally { recovering = false; }
    };
    void recover();
    const timer = setInterval(() => { void recover(); }, 60_000);
    timer.unref();
    return {
        worker,
        async close() {
            clearInterval(timer);
            await worker.close();
            await closeWalletSettlementQueue();
        },
    };
}

if (require.main === module) {
    connectDB().then(() => {
        const running = startWalletSettlementWorker();
        const shutdown = async () => { await running.close(); await knex.destroy(); };
        process.once('SIGTERM', () => { void shutdown(); });
        process.once('SIGINT', () => { void shutdown(); });
        console.log('USD wallet settlement worker started');
    }).catch(() => { console.error('Could not start USD wallet settlement worker'); process.exitCode = 1; });
}
