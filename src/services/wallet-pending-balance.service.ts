import knex from '../db/knex';
import { PendingWalletReleaseRepository } from '../repositories/PendingWalletReleaseRepository';
import { WalletRepository } from '../repositories/WalletRepository';
import { WalletModel } from '../models/WalletModel';
import { enqueueWalletRelease } from '../queues/wallet-settlement.queue';
import { TransactionRepository } from '../repositories/TransactionRepository';
import { isConfirmedNonCard, type PaymentMethodEvidence } from '../utils/payment-method';
import type { Knex } from 'knex';

export class WalletPendingBalanceService {
    static async enqueueTransaction(transactionId: number): Promise<void> {
        try {
            const release = await PendingWalletReleaseRepository.forTransaction(transactionId);
            if (!release) return;
            await enqueueWalletRelease(release);
            await PendingWalletReleaseRepository.query().where({ id: release.id, status: 'pending' })
                .update({ queue_checked_at: knex.fn.now() });
        } catch {
            // The financial release record committed with the credit. The worker
            // repairs missing jobs, so Redis downtime must not undo a paid gift.
            console.error('USD wallet release is awaiting background queue recovery', { transactionId });
        }
    }

    static async confirmPaymentMethod(transactionId: number, method: PaymentMethodEvidence): Promise<void> {
        if (method.type === 'unknown') return;
        const release = await PendingWalletReleaseRepository.forTransaction(transactionId);
        if (release && isConfirmedNonCard(method)) {
            await this.release(release.id, method);
            return;
        }
        // Save newly verified evidence without replacing a previously known rail.
        await knex('transactions').where({ id: transactionId })
            .whereRaw("coalesce(metadata->'payment_method'->>'type', 'unknown') = 'unknown'")
            .update({ metadata: knex.raw("jsonb_set(coalesce(metadata, '{}'::jsonb), '{payment_method}', ?::jsonb)", [JSON.stringify(method)]) });
    }

    static async release(releaseId: string, confirmedMethod?: PaymentMethodEvidence): Promise<boolean> {
        return knex.transaction((trx) => this.releaseInTransaction(releaseId, trx, confirmedMethod));
    }

    static async releaseInTransaction(releaseId: string, trx: Knex.Transaction, confirmedMethod?: PaymentMethodEvidence,
        adminOverride?: { admin_id: number; reason: string; request_id: string }): Promise<boolean> {
        const release = await PendingWalletReleaseRepository.query(trx).where({ id: releaseId }).forUpdate().first();
        if (!release || release.status === 'released') return false;
        const { rows } = await trx.raw('SELECT clock_timestamp() AS now');
        const now = new Date(rows[0].now);
        const wallet = await WalletModel.query(trx).findById(release.wallet_id).forUpdate();
        if (!wallet || wallet.currency !== release.currency || release.currency !== 'USD') throw new Error('Invalid USD settlement wallet');
        // Keep the same release -> wallet -> source lock order for scheduled
        // jobs and later non-card confirmations to avoid races/deadlocks.
        const source = await TransactionRepository.getByIdForUpdate(release.transaction_id, trx);
        if (!source || source.wallet_id !== wallet.id || source.currency !== wallet.currency
            || source.status !== 'completed' || !['gift', 'store'].includes(source.type)) throw new Error('Invalid settlement source transaction');
        const immediate = isConfirmedNonCard(confirmedMethod) && source.metadata?.payment_method?.type !== 'card';
        const due = new Date(release.release_at).getTime() <= now.getTime();
        if (!due && !immediate && !adminOverride) {
            if (confirmedMethod) return false;
            throw new Error('USD settlement is not due yet');
        }
        const amount = PendingWalletReleaseRepository.amountMinor(release) / 100;
        const ledgerMetadata = { pending_release_id: release.id, ...(adminOverride ? { admin_override: adminOverride } : {}) };
        await WalletRepository.debitWallet(wallet.id, amount, trx, {
            transactionId: release.transaction_id, balanceType: 'pending', entryType: 'pending_release',
            reference: `pending_release:${release.id}:pending_debit`, metadata: ledgerMetadata,
        });
        await WalletRepository.creditWallet(wallet.id, amount, trx, {
            transactionId: release.transaction_id, balanceType: 'available', entryType: 'pending_release',
            reference: `pending_release:${release.id}:available_credit`, metadata: ledgerMetadata,
        });
        await PendingWalletReleaseRepository.query(trx).where({ id: release.id }).update({
            status: 'released', released_at: now,
        });
        // Preserve the original gross gift/sale and fee metadata for history.
        await trx('transactions').where({ id: release.transaction_id }).update({
            metadata: trx.raw("coalesce(metadata, '{}'::jsonb) || ?::jsonb", [JSON.stringify({
                ...(immediate ? { payment_method: confirmedMethod } : {}),
                wallet_settlement: {
                    ...(source.metadata?.wallet_settlement || {}),
                    status: 'available', amount: release.amount, currency: release.currency,
                    pending_release_id: release.id, release_at: new Date(release.release_at).toISOString(), released_at: now.toISOString(),
                    business_days: Number(release.business_days), timezone: release.timezone,
                    release_reason: adminOverride ? 'admin_override' : immediate && !due ? 'confirmed_non_card' : 'hold_elapsed',
                    ...(adminOverride ? { admin_override: adminOverride } : {}),
                },
            })]),
        });
        return true;
    }

    /** Durable recovery also handles a Redis outage or a lost/failed delayed job. */
    static async recover(limit = 100): Promise<void> {
        const due = await PendingWalletReleaseRepository.query().where({ status: 'pending' })
            .where('release_at', '<=', knex.fn.now()).orderBy('release_at').limit(limit);
        for (const release of due) {
            try { await this.release(release.id); }
            catch (err) { console.error('USD pending balance release failed', { releaseId: release.id, message: (err as Error).message }); }
        }
        const unscheduled = await PendingWalletReleaseRepository.query().where({ status: 'pending' })
            .where((query) => { query.whereNull('queue_checked_at').orWhere('queue_checked_at', '<', new Date(Date.now() - 5 * 60_000)); })
            .orderByRaw('queue_checked_at ASC NULLS FIRST').limit(limit);
        for (const release of unscheduled) {
            await enqueueWalletRelease(release);
            await PendingWalletReleaseRepository.query().where({ id: release.id, status: 'pending' })
                .update({ queue_checked_at: knex.fn.now() });
        }
    }
}
