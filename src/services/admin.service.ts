import type { Knex } from 'knex';
import knex from '../db/knex';
import { WalletRepository } from '../repositories/WalletRepository';
import { WalletPendingBalanceService } from './wallet-pending-balance.service';
import { isAdminEmail } from '../middlewares/admin.middleware';
import { minorToMoney, moneyToMinor } from '../utils/money';
import type { listQuery } from '../validators/admin.validator';
import type { z } from 'zod';

type ListQuery = z.infer<typeof listQuery>;
export class AdminError extends Error {
    constructor(message: string, public status = 400) { super(message); }
}

// Escape LIKE wildcards so searches are literal and bounded.
const searchPattern = (search: string) => `%${search.replace(/[\\%_]/g, '\\$&')}%`;
const identityColumns = ['u.id as user_id', 'u.email', 'c.username', 'c.first_name', 'c.last_name'];

async function page(query: Knex.QueryBuilder, options: ListQuery, order: string) {
    const [{ count }, items] = await Promise.all([
        query.clone().clearSelect().clearOrder().count('* as count').first(),
        query.clone().orderBy(order, 'desc').limit(options.limit).offset(options.offset),
    ]);
    return { items: items as Record<string, any>[], total: Number(count), limit: options.limit, offset: options.offset };
}

function filterOwner(query: Knex.QueryBuilder, options: ListQuery) {
    if (options.user_id) query.where('u.id', options.user_id);
    if (options.currency) query.where('w.currency', options.currency);
}

// Serialize retries by actor/key, then replay the original committed result.
// The audit record commits in the same transaction as every state change.
async function mutate(actorId: number, requestId: string, action: string, targetId: string, reason: string,
    input: Record<string, unknown>, work: (trx: Knex.Transaction) => Promise<unknown>) {
    return knex.transaction(async (trx) => {
        await trx.raw('SELECT pg_advisory_xact_lock(hashtextextended(?, 0))', [`admin:${actorId}:${requestId}`]);
        const existing = await trx('admin_audit_logs').where({ actor_id: actorId, request_id: requestId }).first();
        if (existing) {
            if (existing.action !== action || existing.target_id !== targetId || existing.reason !== reason
                || JSON.stringify(existing.input) !== JSON.stringify(input)) {
                throw new AdminError('This request ID was already used for a different operation', 409);
            }
            return existing.result;
        }
        const result = await work(trx);
        await trx('admin_audit_logs').insert({ actor_id: actorId, request_id: requestId, action,
            target_id: targetId, reason, input: JSON.stringify(input), result: JSON.stringify(result) });
        return result;
    });
}

export class AdminService {
    static async overview() {
        // One snapshot keeps wallet totals and account counts consistent.
        return knex.transaction(async (trx) => {
            await trx.raw('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY');
            const users = await trx('users').select(trx.raw(`count(*)::int as total,
                count(*) filter (where is_blocked)::int as blocked,
                count(*) filter (where verified)::int as verified`)).first();
            const wallets = await trx('wallets').select('currency').sum({ available: 'balance', pending: 'pending_balance' })
                .select(trx.raw('sum(balance + pending_balance)::text as total')).count('* as wallets').groupBy('currency');
            const pending = await trx('wallet_pending_releases').where({ status: 'pending' }).count('* as total').first();
            return { users: { ...users, active: users.total - users.blocked }, wallets, pending_releases: Number(pending!.total) };
        });
    }

    static async users(options: ListQuery) {
        const query = knex('users as u').leftJoin('creators as c', 'c.user_id', 'u.id')
            .select('u.id', 'u.email', 'u.verified', 'u.is_blocked', 'u.created_at', 'c.id as creator_id',
                'c.username', 'c.first_name', 'c.last_name', 'c.avatar_url');
        if (options.search) query.where((q) => {
            q.whereILike('u.email', searchPattern(options.search)).orWhereILike('c.username', searchPattern(options.search))
                .orWhereILike('c.first_name', searchPattern(options.search)).orWhereILike('c.last_name', searchPattern(options.search));
        });
        if (options.status === 'active' || options.status === 'blocked') query.where('u.is_blocked', options.status === 'blocked');
        const result = await page(query, options, 'u.id');
        const creators = result.items.map((user) => user.creator_id).filter(Boolean);
        const wallets = creators.length ? await knex('wallets').whereIn('creator_id', creators)
            .select('id', 'creator_id', 'currency', 'balance', 'pending_balance').orderBy('currency') : [];
        return { ...result, items: result.items.map((user) => ({ ...user,
            wallets: wallets.filter((wallet) => wallet.creator_id === user.creator_id), is_admin: isAdminEmail(user.email) })) };
    }

    static async transactions(options: ListQuery) {
        const query = knex('transactions as t').join('wallets as w', 'w.id', 't.wallet_id')
            .join('creators as c', 'c.id', 'w.creator_id').join('users as u', 'u.id', 'c.user_id')
            .select('t.*', ...identityColumns);
        filterOwner(query, options);
        if (['pending', 'completed', 'failed'].includes(options.status)) query.where('t.status', options.status);
        if (options.search) query.where((q) => {
            q.whereILike('t.reference', searchPattern(options.search)).orWhereILike('u.email', searchPattern(options.search))
                .orWhereILike('c.username', searchPattern(options.search));
        });
        return page(query, options, 't.id');
    }

    static async releases(options: ListQuery) {
        const query = knex('wallet_pending_releases as r').join('wallets as w', 'w.id', 'r.wallet_id')
            .join('creators as c', 'c.id', 'w.creator_id').join('users as u', 'u.id', 'c.user_id')
            .join('transactions as t', 't.id', 'r.transaction_id')
            .where('r.status', 'pending').select('r.*', 't.reference', 't.type', ...identityColumns);
        filterOwner(query, options);
        if (options.search) query.where((q) => {
            q.whereILike('t.reference', searchPattern(options.search)).orWhereILike('u.email', searchPattern(options.search))
                .orWhereILike('c.username', searchPattern(options.search));
        });
        return page(query, options, 'r.id');
    }

    static async audit(options: ListQuery) {
        const query = knex('admin_audit_logs as a').join('users as u', 'u.id', 'a.actor_id')
            .select('a.id', 'a.action', 'a.target_id', 'a.reason', 'a.input', 'a.result', 'a.created_at', 'u.email as actor_email');
        return page(query, options, 'a.id');
    }

    static async block(actorId: number, userId: number, body: { request_id: string; reason: string; blocked: boolean }) {
        return mutate(actorId, body.request_id, body.blocked ? 'block_user' : 'unblock_user', String(userId), body.reason,
            { blocked: body.blocked }, async (trx) => {
                const user = await trx('users').where({ id: userId }).forUpdate().first();
                if (!user) throw new AdminError('User not found', 404);
                if (body.blocked && (userId === actorId || isAdminEmail(user.email))) {
                    throw new AdminError('Administrator accounts cannot be blocked here');
                }
                await trx('users').where({ id: userId }).update({ is_blocked: body.blocked });
                return { user_id: userId, blocked: body.blocked, previously_blocked: user.is_blocked };
            });
    }

    static async debit(actorId: number, walletId: number, body: { request_id: string; reason: string; amount: string }) {
        const amount = minorToMoney(moneyToMinor(body.amount));
        return mutate(actorId, body.request_id, 'debit_wallet', String(walletId), body.reason, { amount }, async (trx) => {
            const wallet = await trx('wallets').where({ id: walletId }).forUpdate().first();
            if (!wallet) throw new AdminError('Wallet not found', 404);
            if (moneyToMinor(wallet.balance) < moneyToMinor(amount)) throw new AdminError('Insufficient main wallet balance');
            const reference = `admin_debit_${actorId}_${body.request_id}`;
            const metadata = { admin_id: actorId, reason: body.reason, request_id: body.request_id, balance_type: 'available' };
            const [transaction] = await trx('transactions').insert({ wallet_id: walletId, type: 'admin_debit', amount,
                currency: wallet.currency, status: 'completed', reference, provider: 'admin', description: Array.from(body.reason).slice(0, 255).join(''),
                metadata: JSON.stringify(metadata) }).returning('*');
            const updated = await WalletRepository.debitWallet(walletId, Number(amount), trx, {
                transactionId: transaction.id, reference, entryType: 'admin_debit', balanceType: 'available', metadata,
            });
            return { transaction_id: transaction.id, reference, wallet_id: walletId, currency: wallet.currency,
                amount, balance_before: wallet.balance, balance_after: updated.balance };
        });
    }

    static async release(actorId: number, releaseId: string, body: { request_id: string; reason: string }) {
        return mutate(actorId, body.request_id, 'release_pending', releaseId, body.reason, {}, async (trx) => {
            const released = await WalletPendingBalanceService.releaseInTransaction(releaseId, trx, undefined,
                { admin_id: actorId, reason: body.reason, request_id: body.request_id });
            const release = await trx('wallet_pending_releases').where({ id: releaseId }).first();
            if (!release) throw new AdminError('Pending settlement not found', 404);
            return { released, already_released: !released, release_id: releaseId, transaction_id: release.transaction_id,
                wallet_id: release.wallet_id, amount: release.amount, currency: release.currency };
        });
    }
}
