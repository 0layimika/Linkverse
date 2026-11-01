import type { Transaction } from 'objection';
import knex from '../db/knex';
import { USD_SETTLEMENT_BUSINESS_DAYS } from '../config/env';
import { addLagosBusinessDays } from '../utils/business-days';
import { minorToMoney, moneyToMinor } from '../utils/money';
import { UNKNOWN_PAYMENT_METHOD, type PaymentMethodEvidence } from '../utils/payment-method';

export interface PendingWalletRelease {
    id: string;
    wallet_id: number;
    transaction_id: number;
    amount: string;
    currency: 'USD';
    status: 'pending' | 'released';
    release_at: Date | string;
    released_at: Date | string | null;
    queue_checked_at: Date | string | null;
    business_days: string;
    timezone: string;
}

export const PendingWalletReleaseRepository = {
    query(db = knex) { return db<PendingWalletRelease>('wallet_pending_releases'); },

    async create(walletId: number, transactionId: number, amountMinor: number, trx: Transaction, method: PaymentMethodEvidence = UNKNOWN_PAYMENT_METHOD) {
        if (amountMinor <= 0) return null;
        const { rows } = await trx.raw('SELECT clock_timestamp() AS now');
        const releaseAt = addLagosBusinessDays(new Date(rows[0].now), USD_SETTLEMENT_BUSINESS_DAYS);
        const [release] = await trx<PendingWalletRelease>('wallet_pending_releases').insert({
            wallet_id: walletId, transaction_id: transactionId, amount: minorToMoney(amountMinor), currency: 'USD',
            release_at: releaseAt,
            business_days: String(USD_SETTLEMENT_BUSINESS_DAYS), timezone: 'Africa/Lagos',
        }).returning('*');
        const settlement = {
            status: 'pending', amount: release!.amount, currency: 'USD', release_at: releaseAt.toISOString(),
            pending_release_id: release!.id, business_days: USD_SETTLEMENT_BUSINESS_DAYS, timezone: 'Africa/Lagos',
            hold_reason: method.type === 'card' ? 'card' : 'unknown_method',
        };
        await trx('transactions').where({ id: transactionId }).update({
            metadata: trx.raw("coalesce(metadata, '{}'::jsonb) || ?::jsonb", [JSON.stringify({ wallet_settlement: settlement })]),
        });
        return release!;
    },

    async forTransaction(transactionId: number) {
        return this.query().where({ transaction_id: transactionId, status: 'pending' }).first();
    },

    amountMinor(release: PendingWalletRelease) { return moneyToMinor(release.amount); },
};
