import { createClient } from 'redis';
import { REDIS_URL } from './env';

type RedisConnection = ReturnType<typeof createClient>;
let client: RedisConnection | undefined;
let connecting: Promise<RedisConnection> | undefined;

/** Share a lazy connection across requests, including warm serverless invocations. */
export async function getRedis(): Promise<RedisConnection> {
    if (!REDIS_URL) throw new Error('REDIS_URL is required for withdrawal quote caching');
    if (client?.isReady) return client;
    if (!connecting) {
        connecting = (async () => {
            if (client?.isOpen) client.destroy();
            const next = createClient({
                url: REDIS_URL,
                socket: { connectTimeout: 5000, reconnectStrategy: false },
                commandOptions: { timeout: 5000 },
                disableOfflineQueue: true,
                commandsQueueMaxLength: 100,
            });
            // Connection errors can contain endpoint/credential details; do not log them.
            next.on('error', () => console.error('Redis cache connection error'));
            client = next;
            try {
                await next.connect();
                return next;
            } catch {
                if (next.isOpen) next.destroy();
                if (client === next) client = undefined;
                throw new Error('Redis cache is unavailable');
            }
        })().finally(() => { connecting = undefined; });
    }
    return connecting;
}
