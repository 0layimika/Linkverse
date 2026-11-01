import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { BadRequest, InternalError, NotFound, Ok } from '@0layimika/api-response-kit';
import knex from '../db/knex';
import { NGN_WITHDRAWAL_FEE_MINOR, USD_WITHDRAWAL_FEE_PERCENT, WITHDRAWAL_QUOTE_TTL_SECONDS } from '../config/env';
import { CreatorRepository } from '../repositories/CreatorRepository';
import { BankAccountRepository } from '../repositories/BankAccountRepository';
import { TransactionRepository } from '../repositories/TransactionRepository';
import { WalletRepository } from '../repositories/WalletRepository';
import { UserRepository } from '../repositories/UserRepository';
import { WithdrawalPayoutRepository } from '../repositories/WithdrawalPayoutRepository';
import type { CachedWithdrawalQuote, WithdrawalPayout } from '../types/withdrawal.types';
import { WithdrawalQuoteCache } from './withdrawal-quote-cache.service';
import { WalletModel } from '../models/WalletModel';
import { BankAccountModel } from '../models/BankAccountModel';
import { WalletService } from './wallet.service';
import { getPaymentProvider, getPaymentProviderByName } from '../providers/PaymentProviderFactory';
import { BachsRequestError } from '../providers/BachsProvider';
import { WithdrawalSettlementService } from './withdrawal-settlement.service';
import { minorToMoney, moneyToMinor, percentageFeeMinor } from '../utils/money';
import type { InitiateTransferResponse } from '../types/payment.types';

class WithdrawalInputError extends Error {}
const userRepo = new UserRepository();
const SUBMISSION_BUFFER_MS = 2000;

export class WithdrawalQuoteService {
    private static details(quote: CachedWithdrawalQuote) {
        return {
            quote_id: quote.id, amount: quote.amount, currency: quote.currency,
            fee: quote.fee, fee_currency: quote.currency, total_debit: quote.total_debit,
            receive_amount: quote.receive_amount, receive_currency: quote.receive_currency,
            exchange_rate: quote.exchange_rate, expires_at: new Date(quote.expires_at).toISOString(),
        };
    }

    private static execution(quote: WithdrawalPayout) {
        return {
            ...this.details(quote), transaction_id: quote.transaction_id, reference: quote.reference,
            status: quote.status === 'completed' ? 'completed' : quote.status === 'failed' ? 'failed' : 'pending',
        };
    }

    private static error(err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
        if (error instanceof WithdrawalInputError || (error instanceof BachsRequestError && !error.outcomeUnknown)) {
            return BadRequest(error.message);
        }
        return InternalError(error.message);
    }

    static async quote(userId: number, data: { amount: number; currency?: 'NGN' | 'USD' }) {
        try {
            const currency = data.currency || 'NGN';
            if (!['NGN', 'USD'].includes(currency)) return BadRequest('Currency must be NGN or USD');
            let amountMinor: number;
            try { amountMinor = moneyToMinor(data.amount); } catch (err) {
                throw new WithdrawalInputError((err as Error).message);
            }
            const minimum = currency === 'USD' ? 100 : 100000;
            if (amountMinor < minimum) return BadRequest(`Minimum withdrawal amount is ${minimum / 100} ${currency}`);
            const creator = await CreatorRepository.getOneWhere({ user_id: userId });
            if (!creator) return NotFound('Creator profile not found');
            const user = await userRepo.getOneWhere({ id: userId });
            if (!user) return NotFound('User not found');
            const bank = await BankAccountRepository.getByCreatorId(creator.id);
            if (!bank) return BadRequest('Please set up your bank account for withdrawal');
            const provider = getPaymentProvider();
            if (currency === 'USD' && provider.providerName !== 'bachs') return BadRequest('USD withdrawal quotes require Bachs');
            let recipientCode = bank.recipient_code;
            if (!recipientCode || bank.provider !== provider.providerName) {
                const recipient = await provider.createTransferRecipient({
                    account_number: bank.account_number, account_name: bank.account_name,
                    bank_code: bank.bank_code, bank_name: bank.bank_name, currency: 'NGN',
                });
                if (!recipient.success || !recipient.recipient_code) return BadRequest('Could not prepare the bank destination');
                // Store the recipient on the quote; do not overwrite a concurrently edited bank account.
                recipientCode = recipient.recipient_code;
            }
            await provider.validateTransferRecipient(recipientCode);
            const wallet = await WalletService.getOrCreateWallet(creator.id, currency);
            const reference = `withdraw_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
            const amount = minorToMoney(amountMinor);
            let feeMinor = NGN_WITHDRAWAL_FEE_MINOR;
            let receiveAmount = amount;
            let exchangeRate: string | null = null;
            let providerQuoteId: string | null = null;
            let providerQuote: Record<string, unknown> | null = null;
            let expiresAt = new Date(Date.now() + WITHDRAWAL_QUOTE_TTL_SECONDS * 1000);
            if (currency === 'USD') {
                const quote = await provider.quoteTransfer(amount, currency, reference);
                feeMinor = percentageFeeMinor(amountMinor, Math.round(USD_WITHDRAWAL_FEE_PERCENT * 100));
                receiveAmount = quote.to_amount;
                exchangeRate = quote.exchange_rate;
                providerQuoteId = quote.quote_id;
                providerQuote = quote.raw;
                expiresAt = new Date(quote.expires_at);
            }
            if (expiresAt.getTime() <= Date.now() + SUBMISSION_BUFFER_MS) return BadRequest('Quote expired; request a new quote');
            const quote: CachedWithdrawalQuote = {
                id: `wq_${crypto.randomUUID()}`, creator_id: creator.id, wallet_id: wallet.id,
                bank_account_id: bank.id, bank_snapshot: {
                    account_number: bank.account_number, account_name: bank.account_name,
                    bank_code: bank.bank_code, bank_name: bank.bank_name, updated_at: new Date(bank.updated_at).toISOString(),
                },
                recipient_code: recipientCode, provider: provider.providerName, currency, amount,
                payout_email: user.email || null,
                fee: minorToMoney(feeMinor), total_debit: minorToMoney(amountMinor + feeMinor),
                receive_amount: receiveAmount, receive_currency: 'NGN', exchange_rate: exchangeRate,
                provider_quote_id: providerQuoteId, provider_quote: providerQuote, expires_at: expiresAt.toISOString(), reference,
            };
            await WithdrawalQuoteCache.save(quote);
            return Ok({
                ...this.details(quote), balance: minorToMoney(moneyToMinor(wallet.balance)),
                pending_balance: minorToMoney(moneyToMinor(wallet.pending_balance)),
                sufficient_balance: moneyToMinor(wallet.balance) >= amountMinor + feeMinor,
                bank_account: { bank_name: bank.bank_name, account_name: bank.account_name, account_last_four: bank.account_number.slice(-4) },
            }, 'Withdrawal quote created');
        } catch (err) { return this.error(err); }
    }

    static async execute(userId: number, data: { quote_id: string; password: string }) {
        try {
            const creator = await CreatorRepository.getOneWhere({ user_id: userId });
            if (!creator) return NotFound('Creator profile not found');
            const user = await userRepo.getOneWhere({ id: userId });
            if (!user?.password_hash || !(await bcrypt.compare(data.password, user.password_hash))) return BadRequest('Incorrect password');
            let consumedQuoteId: string | undefined;
            let quote = await WithdrawalPayoutRepository.get(data.quote_id, creator.id);
            if (!quote) {
                const cached = await WithdrawalQuoteCache.get(creator.id, data.quote_id);
                if (!cached) {
                    // Another request may have committed and removed the cached quote
                    // after our first lookup. Execution retries still return its payout.
                    quote = await WithdrawalPayoutRepository.get(data.quote_id, creator.id);
                    if (!quote) return BadRequest('Quote expired or unavailable; request and review a new quote');
                } else {
                    if (new Date(cached.expires_at).getTime() <= Date.now() + SUBMISSION_BUFFER_MS) return BadRequest('Quote expired; request and review a new quote');
                    await getPaymentProviderByName(cached.provider).validateTransferRecipient(cached.recipient_code);
                    quote = await knex.transaction(async (trx) => {
                        // All executions of this quote serialize on its wallet, even
                        // while the quote exists in Redis on several app instances.
                        const wallet = await WalletModel.query(trx).findById(cached.wallet_id).forUpdate();
                        if (!wallet || wallet.creator_id !== creator.id || wallet.currency !== cached.currency) {
                            throw new WithdrawalInputError('Withdrawal wallet not found');
                        }
                        const existing = await WithdrawalPayoutRepository.get(cached.id, creator.id, trx, true);
                        if (existing) return existing;
                        const locked = cached;
                        if (new Date(locked.expires_at).getTime() <= Date.now() + SUBMISSION_BUFFER_MS) {
                            throw new WithdrawalInputError('Quote expired; request and review a new quote');
                        }
                        const bank = await BankAccountModel.query(trx).findById(locked.bank_account_id).forUpdate();
                        const snapshot = locked.bank_snapshot;
                        if (!bank || bank.creator_id !== creator.id || bank.account_number !== snapshot.account_number
                            || bank.bank_code !== snapshot.bank_code || bank.account_name !== snapshot.account_name
                            || new Date(bank.updated_at).toISOString() !== snapshot.updated_at) {
                            throw new WithdrawalInputError('Bank account changed; request a new quote');
                        }
                        if (moneyToMinor(wallet.balance) < moneyToMinor(locked.total_debit)) {
                            throw new WithdrawalInputError(`Insufficient balance; ${locked.total_debit} ${locked.currency} is required including the fee`);
                        }
                        const metadata = {
                            quote_id: locked.id, fee: locked.fee, total_debit: locked.total_debit,
                            receive_amount: locked.receive_amount, receive_currency: locked.receive_currency,
                            exchange_rate: locked.exchange_rate, provider_quote_id: locked.provider_quote_id,
                            bank_name: snapshot.bank_name, account_number: snapshot.account_number, account_name: snapshot.account_name,
                        };
                        const withdrawal = await TransactionRepository.create({
                            wallet_id: wallet.id, type: 'withdrawal', amount: Number(locked.amount), currency: locked.currency,
                            status: 'pending', reference: locked.reference, provider: locked.provider,
                            description: `Withdrawal to ${snapshot.bank_name} - ${snapshot.account_number}`, metadata,
                        }, {}, trx);
                        await WalletRepository.debitWallet(wallet.id, Number(locked.amount), trx, {
                            transactionId: withdrawal.id, reference: `withdrawal:${locked.reference}:debit`, entryType: 'withdrawal',
                        });
                        let feeId: number | null = null;
                        if (moneyToMinor(locked.fee) > 0) {
                            const fee = await TransactionRepository.create({
                                wallet_id: wallet.id, type: 'fee', amount: Number(locked.fee), currency: locked.currency,
                                status: 'pending', reference: `withdrawal_fee_${withdrawal.id}`, provider: locked.provider,
                                description: 'Withdrawal fee', metadata: { withdrawal_transaction_id: withdrawal.id, quote_id: locked.id },
                            }, {}, trx);
                            feeId = fee.id;
                            await WalletRepository.debitWallet(wallet.id, Number(locked.fee), trx, {
                                transactionId: fee.id, reference: `transaction:${fee.id}:debit`, entryType: 'withdrawal_fee',
                                metadata: { withdrawal_transaction_id: withdrawal.id },
                            });
                        }
                        await TransactionRepository.update(withdrawal.id, { metadata: { ...metadata, fee_transaction_id: feeId } }, trx);
                        const [payout] = await WithdrawalPayoutRepository.query(trx).insert({
                            ...locked, status: 'submitting', transaction_id: withdrawal.id, fee_transaction_id: feeId,
                        }).returning('*');
                        return payout!;
                    });
                    consumedQuoteId = cached.id;
                }
            }
            if (['submitting', 'submitted'].includes(quote.status)) await this.processQuote(quote.id);
            // Keep the quote on rollback. Delete after commit and submission so
            // cache cleanup cannot eat into the provider's short quote lifetime.
            // A failed delete is harmless: the persisted payout guards retries.
            if (consumedQuoteId) {
                try { await WithdrawalQuoteCache.delete(creator.id, consumedQuoteId); }
                catch { console.error('Could not remove executed withdrawal quote from Redis'); }
            }
            const current = await WithdrawalPayoutRepository.get(quote.id, creator.id);
            return Ok(this.execution(current!), current!.status === 'failed' ? 'Withdrawal failed; amount and fee refunded' : 'Withdrawal request received');
        } catch (err) { return this.error(err); }
    }

    private static async recordResult(quote: WithdrawalPayout, result: InitiateTransferResponse) {
        if (!result.success && result.status !== 'failed') throw new Error('Payout submission outcome is unknown');
        if (result.status === 'success' || result.status === 'failed') {
            await WithdrawalSettlementService.settle(quote.provider, quote.reference, result.status, result.transfer_code, result.provider_response);
        } else {
            await WithdrawalPayoutRepository.query().where({ id: quote.id }).whereIn('status', ['submitting', 'submitted']).update({
                status: 'submitted', submission_state: 'accepted', provider_payout_id: result.transfer_code,
                provider_payout: result.provider_response || null, error_message: null,
                lease_expires_at: null, next_reconcile_at: new Date(Date.now() + 60_000), updated_at: knex.fn.now(),
            });
            await TransactionRepository.update(quote.transaction_id!, { provider_reference: result.transfer_code });
        }
    }

    /** A database lease prevents request retries and the recovery job from submitting concurrently. */
    private static async processQuote(id: string) {
        const leaseToken = new Date(Date.now() + 60_000);
        const [quote] = await WithdrawalPayoutRepository.query().where({ id }).whereIn('status', ['submitting', 'submitted'])
            .where((query) => { query.whereNull('lease_expires_at').orWhere('lease_expires_at', '<', knex.fn.now()); })
            .where((query) => { query.whereNull('next_reconcile_at').orWhere('next_reconcile_at', '<=', knex.fn.now()); })
            .update({ lease_expires_at: leaseToken, updated_at: knex.fn.now() }).returning('*');
        if (!quote) return;
        const priorAttempt = quote.attempts > 0;
        try {
            const provider = getPaymentProviderByName(quote.provider);
            if (priorAttempt) {
                // Look up the original operation before considering an identical retry.
                const existing = await provider.findTransfer(quote.reference);
                if (existing) { await this.recordResult(quote, existing); return; }
                if (quote.submission_state === 'accepted' || quote.provider !== 'bachs'
                    || !quote.first_submitted_at || Date.now() - new Date(quote.first_submitted_at).getTime() >= 23 * 3600_000) {
                    throw new Error('Payout requires reconciliation; no replacement has been submitted');
                }
            } else if (new Date(quote.expires_at).getTime() <= Date.now() + SUBMISSION_BUFFER_MS) {
                await WithdrawalSettlementService.settle(quote.provider, quote.reference, 'failed');
                return;
            }
            // Persist the attempt before the network call. A crash after this write is an uncertain outcome.
            const claimed = await WithdrawalPayoutRepository.query().where({ id, lease_expires_at: leaseToken }).whereIn('status', ['submitting', 'submitted']).update({
                submission_state: 'in_flight', attempts: knex.raw('attempts + 1'),
                first_submitted_at: quote.first_submitted_at || new Date(), updated_at: knex.fn.now(),
            });
            if (claimed !== 1) return;
            const result = await provider.initiateTransfer({
                amount: moneyToMinor(quote.amount), currency: quote.currency,
                recipient_code: quote.recipient_code, reference: quote.reference,
                ...(quote.provider_quote_id ? { quote_id: quote.provider_quote_id } : {}),
                reason: 'CreatorLink Withdrawal',
                email: quote.payout_email || '',
            });
            await this.recordResult(quote, result);
        } catch (err) {
            // A definite rejection on the first attempt is safe to refund. A
            // previous timeout must be resolved, even if a later retry is rejected.
            if (!priorAttempt && err instanceof BachsRequestError && !err.outcomeUnknown) {
                await WithdrawalSettlementService.settle(quote.provider, quote.reference, 'failed', undefined, { failure_reason: err.message });
            } else {
                await WithdrawalPayoutRepository.query().where({ id, lease_expires_at: leaseToken }).whereIn('status', ['submitting', 'submitted']).update({
                    submission_state: 'unknown', error_message: (err as Error).message,
                    lease_expires_at: null, next_reconcile_at: new Date(Date.now() + 60_000), updated_at: knex.fn.now(),
                });
            }
        }
    }

    static async reconcilePending(creatorId?: number, limit = 5) {
        const quotes = await WithdrawalPayoutRepository.query().whereIn('status', ['submitting', 'submitted'])
            .modify((query) => { if (creatorId !== undefined) query.where({ creator_id: creatorId }); })
            .where((query) => { query.whereNull('next_reconcile_at').orWhere('next_reconcile_at', '<=', knex.fn.now()); })
            .where((query) => { query.whereNull('lease_expires_at').orWhere('lease_expires_at', '<', knex.fn.now()); })
            .orderBy('updated_at').limit(limit);
        for (const quote of quotes) await this.processQuote(quote.id);
    }

    static async history(userId: number, limit = 50, offset = 0) {
        try {
            const creator = await CreatorRepository.getOneWhere({ user_id: userId });
            if (!creator) return NotFound('Creator profile not found');
            await this.reconcilePending(creator.id, 2);
            const wallets = await WalletRepository.getAllByCreatorId(creator.id);
            const withdrawals = await TransactionRepository.getWithdrawalsForWallets(wallets.map((wallet) => wallet.id), limit, offset);
            return Ok(withdrawals, 'Withdrawal history retrieved successfully');
        } catch (err) { return this.error(err); }
    }
}
