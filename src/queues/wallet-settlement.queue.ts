import { Queue, type ConnectionOptions } from 'bullmq';
import { NODE_ENV, REDIS_URL } from '../config/env';
import type { PendingWalletRelease } from '../repositories/PendingWalletReleaseRepository';

export const WALLET_SETTLEMENT_QUEUE = 'wallet-settlements';
export const WALLET_SETTLEMENT_PREFIX = `creatorlink:${NODE_ENV}`;
export interface WalletSettlementJob { releaseId: string }
let queue: Queue<WalletSettlementJob> | undefined;

export function walletQueueConnection(worker = false): ConnectionOptions {
    if (!REDIS_URL) throw new Error('REDIS_URL is required for USD wallet settlement jobs');
    return {
        url: REDIS_URL, connectTimeout: 5000,
        maxRetriesPerRequest: worker ? null : 1,
        ...(worker ? {} : { enableOfflineQueue: false }),
    };
}

function getQueue() {
    if (!queue) {
        queue = new Queue<WalletSettlementJob>(WALLET_SETTLEMENT_QUEUE, {
            prefix: WALLET_SETTLEMENT_PREFIX, connection: walletQueueConnection(),
            defaultJobOptions: {
                attempts: 12, backoff: { type: 'exponential', delay: 5000 },
                removeOnComplete: { age: 7 * 24 * 3600, count: 10000 },
                removeOnFail: { age: 30 * 24 * 3600, count: 10000 },
            },
        });
        queue.on('error', () => console.error('Wallet settlement queue connection error'));
    }
    return queue;
}

export async function enqueueWalletRelease(release: PendingWalletRelease): Promise<void> {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const enqueue = async () => {
        const activeQueue = getQueue();
        const jobId = `release-${release.id}`;
        const existing = await activeQueue.getJob(jobId);
        if (existing) {
            const state = await existing.getState();
            if (state === 'failed') { await existing.retry(); return; }
            if (state !== 'completed') return;
            // A durable pending row always wins over a stale queue completion.
            await existing.remove();
        }
        await activeQueue.add('release-usd', { releaseId: String(release.id) }, {
            jobId, delay: Math.max(0, new Date(release.release_at).getTime() - Date.now()),
        });
    };
    try {
        await Promise.race([
            enqueue(),
            new Promise<never>((_resolve, reject) => {
                timeout = setTimeout(() => reject(new Error('Wallet settlement queue unavailable')), 5000);
            }),
        ]);
    } finally { if (timeout) clearTimeout(timeout); }
}

export async function closeWalletSettlementQueue(): Promise<void> {
    const current = queue;
    queue = undefined;
    if (current) await current.close();
}
