import { getRedis } from '../config/redis';

export const CacheService = {
    async get<T>(key: string): Promise<T | null> {
        const redis = await getRedis();
        try {
            const value = await redis.get(key);
            return value === null ? null : JSON.parse(value) as T;
        } catch { throw new Error('Redis cache read failed'); }
    },

    async setUntil(key: string, value: unknown, expiresAt: Date): Promise<void> {
        if (!Number.isFinite(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) throw new Error('Cache expiry must be in the future');
        const redis = await getRedis();
        try {
            await redis.set(key, JSON.stringify(value), { expiration: { type: 'PXAT', value: expiresAt.getTime() } });
        } catch { throw new Error('Redis cache write failed'); }
    },

    async delete(key: string): Promise<void> {
        const redis = await getRedis();
        try { await redis.del(key); } catch { throw new Error('Redis cache delete failed'); }
    },
};
