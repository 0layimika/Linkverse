import { CacheService } from './cache.service';
import type { CachedWithdrawalQuote } from '../types/withdrawal.types';

function key(creatorId: number, quoteId: string): string {
    return `creatorlink:withdrawal:quote:${creatorId}:${quoteId}`;
}

export const WithdrawalQuoteCache = {
    async save(quote: CachedWithdrawalQuote): Promise<void> {
        await CacheService.setUntil(key(quote.creator_id, quote.id), quote, new Date(quote.expires_at));
    },
    async get(creatorId: number, quoteId: string): Promise<CachedWithdrawalQuote | null> {
        const quote = await CacheService.get<CachedWithdrawalQuote>(key(creatorId, quoteId));
        if (!quote || quote.id !== quoteId || quote.creator_id !== creatorId
            || !Number.isFinite(Date.parse(quote.expires_at)) || Date.parse(quote.expires_at) <= Date.now()) return null;
        return quote;
    },
    async delete(creatorId: number, quoteId: string): Promise<void> {
        await CacheService.delete(key(creatorId, quoteId));
    },
};
