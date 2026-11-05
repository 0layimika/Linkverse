import { z } from 'zod';
import { moneyToMinor } from '../utils/money';

const id = z.coerce.number().int().positive().max(2147483647);
const operation = {
    request_id: z.uuid(),
    reason: z.string().trim().min(5).max(500),
};
export const userParams = z.object({ userId: id });
export const walletParams = z.object({ walletId: id });
export const releaseParams = z.object({ releaseId: z.string().regex(/^[1-9]\d*$/).max(19)
    .refine((value) => /^\d{1,19}$/.test(value) && BigInt(value) <= 9223372036854775807n, 'Invalid settlement ID') });
export const blockBody = z.object({ ...operation, blocked: z.boolean() }).strict();
export const releaseBody = z.object(operation).strict();
export const debitBody = z.object({
    ...operation,
    amount: z.string().regex(/^\d+(\.\d{1,2})?$/).refine((value) => {
        try { const minor = moneyToMinor(value); return minor > 0 && minor <= 999999999999999; }
        catch { return false; }
    }, 'Enter a positive amount with at most two decimal places'),
}).strict();
export const listQuery = z.object({
    limit: z.coerce.number().int().min(1).max(100).default(25),
    offset: z.coerce.number().int().min(0).max(10000000).default(0),
    search: z.string().trim().max(120).default(''),
    status: z.enum(['', 'active', 'blocked', 'pending', 'completed', 'failed']).default(''),
    currency: z.enum(['', 'USD', 'NGN']).default(''),
    user_id: id.optional(),
});
