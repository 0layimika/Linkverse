import knex from '../db/knex';
import { TransactionRepository } from '../repositories/TransactionRepository';
import { WalletRepository } from '../repositories/WalletRepository';
import { calculateGiftFee } from '../utils/gift-fee';
import { WalletPendingBalanceService } from './wallet-pending-balance.service';
import { earningsBalanceType, UNKNOWN_PAYMENT_METHOD, type PaymentMethodEvidence } from '../utils/payment-method';

export class GiftSettlementService {
    /** Credit the gross gift and deduct its saved fee atomically, once per gift. */
    static async complete(transactionId: number, providerReference?: string, method: PaymentMethodEvidence = UNKNOWN_PAYMENT_METHOD): Promise<boolean> {
        let pendingCredit = false;
        const processed = await knex.transaction(async (trx) => {
            const gift = await TransactionRepository.getByIdForUpdate(transactionId, trx);
            if (!gift || gift.type !== 'gift') throw new Error('Gift transaction not found');
            if (gift.status === 'completed') return false;

            const grossAmount = Number(gift.amount);
            pendingCredit = earningsBalanceType(gift.currency, method) === 'pending';
            const snapshot = gift.metadata?.gift_fee;
            // Older pending gifts did not have a fee quoted at initiation.
            const fee = calculateGiftFee(grossAmount, snapshot?.rate_percent ?? 0);
            if (snapshot && (typeof snapshot.rate_percent !== 'number' || snapshot.amount_minor !== fee.amount_minor)) {
                throw new Error('Invalid saved gift fee');
            }

            await WalletRepository.creditWallet(gift.wallet_id, grossAmount, trx, {
                transactionId: gift.id,
                entryType: 'wallet_credit',
                reference: `transaction:${gift.id}:credit`,
                pendingReleaseAmountMinor: Math.round(grossAmount * 100) - fee.amount_minor,
                paymentMethod: method,
            });

            if (fee.amount_minor > 0) {
                const feeTransaction = await TransactionRepository.create({
                    wallet_id: gift.wallet_id,
                    type: 'fee',
                    amount: fee.amount_minor / 100,
                    currency: gift.currency,
                    status: 'completed',
                    reference: `gift_fee:${gift.id}`,
                    provider: gift.provider,
                    description: `Gift fee (${fee.rate_percent}%)`,
                    metadata: { gift_transaction_id: gift.id, gift_reference: gift.reference, ...fee },
                }, {}, trx);
                await WalletRepository.debitWallet(gift.wallet_id, feeTransaction.amount, trx, {
                    transactionId: feeTransaction.id,
                    entryType: 'gift_fee',
                    reference: `transaction:${feeTransaction.id}:debit`,
                    balanceType: pendingCredit ? 'pending' : 'available',
                    metadata: { gift_transaction_id: gift.id },
                });
            }

            await TransactionRepository.updateStatus(gift.id, 'completed', providerReference, trx);
            return true;
        });
        if (processed && pendingCredit) await WalletPendingBalanceService.enqueueTransaction(transactionId);
        if (!processed) await WalletPendingBalanceService.confirmPaymentMethod(transactionId, method);
        return processed;
    }
}
