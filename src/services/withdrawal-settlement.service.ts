import knex from '../db/knex';
import { TransactionRepository } from '../repositories/TransactionRepository';
import { TransactionModel } from '../models/TransactionModel';
import { WalletRepository } from '../repositories/WalletRepository';
import { WithdrawalPayoutRepository } from '../repositories/WithdrawalPayoutRepository';
import { moneyToMinor } from '../utils/money';

export class WithdrawalSettlementService {
    /** Used by synchronous provider results, reconciliation and signed webhooks. */
    static async settle(provider: string, reference: string, status: 'success' | 'failed', providerId?: string, data?: Record<string, any>) {
        return knex.transaction(async (trx) => {
            const withdrawal = await TransactionModel.query(trx).findOne({ reference, provider, type: 'withdrawal' }).forUpdate();
            if (!withdrawal) return null;
            if (withdrawal.status !== 'pending') return withdrawal;

            const metadata = withdrawal.metadata || {};
            const assertAmount = (received: unknown, expected: unknown, currency: string) => {
                if (received === undefined || received === null) return;
                if (moneyToMinor(String(received)) !== moneyToMinor(String(expected))) {
                    throw new Error(`Payout amount mismatch for ${reference} in ${currency}`);
                }
            };
            if (data) {
                // Legacy webhook payloads describe the source; newer payout objects
                // describe the destination and carry source_currency separately.
                if (data.from_amount !== undefined) assertAmount(data.from_amount, withdrawal.amount, withdrawal.currency);
                if (String(data.currency || '').toUpperCase() === withdrawal.currency) {
                    assertAmount(data.amount, withdrawal.amount, withdrawal.currency);
                } else if (metadata.receive_currency && String(data.currency || '').toUpperCase() === metadata.receive_currency) {
                    assertAmount(data.amount, metadata.receive_amount, metadata.receive_currency);
                }
                if (data.to_amount !== undefined && metadata.receive_amount !== undefined) {
                    assertAmount(data.to_amount, metadata.receive_amount, metadata.receive_currency);
                }
            }

            const feeId = metadata.fee_transaction_id;
            const fee = feeId ? await TransactionRepository.getByIdForUpdate(Number(feeId), trx) : undefined;
            if (feeId && (!fee || fee.type !== 'fee' || fee.wallet_id !== withdrawal.wallet_id
                || fee.metadata?.withdrawal_transaction_id !== withdrawal.id)) {
                throw new Error('Invalid withdrawal fee transaction');
            }

            if (status === 'failed') {
                await WalletRepository.creditWallet(withdrawal.wallet_id, Number(withdrawal.amount), trx, {
                    transactionId: withdrawal.id, reference: `transaction:${withdrawal.id}:refund`,
                    entryType: 'withdrawal_refund',
                    balanceType: 'available',
                });
                if (fee && Number(fee.amount) > 0) {
                    await WalletRepository.creditWallet(fee.wallet_id, Number(fee.amount), trx, {
                        transactionId: fee.id, reference: `transaction:${fee.id}:refund`,
                        entryType: 'withdrawal_fee_refund', metadata: { withdrawal_transaction_id: withdrawal.id },
                        balanceType: 'available',
                    });
                }
            }

            const finalStatus = status === 'success' ? 'completed' : 'failed';
            if (fee) await TransactionRepository.updateStatus(fee.id, finalStatus, undefined, trx);
            const updated = await TransactionRepository.updateStatus(withdrawal.id, finalStatus, providerId, trx);
            await WithdrawalPayoutRepository.query(trx).where({ transaction_id: withdrawal.id }).update({
                status: finalStatus, submission_state: 'terminal', lease_expires_at: null, next_reconcile_at: null,
                ...(providerId ? { provider_payout_id: providerId } : {}),
                ...(data ? { provider_payout: data } : {}),
                error_message: status === 'failed' ? String(data?.failure_reason || 'Payout failed; amount and fee refunded') : null,
                updated_at: knex.fn.now(),
            });
            return updated;
        });
    }
}
