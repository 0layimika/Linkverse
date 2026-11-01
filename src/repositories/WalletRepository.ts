import { BaseRepository } from "./BaseRepository";
import { WalletModel } from "../models/WalletModel";
import { Transaction } from "objection";
import knex from "../db/knex";
import { PendingWalletReleaseRepository } from './PendingWalletReleaseRepository';
import { moneyToMinor, minorToMoney } from '../utils/money';
import { earningsBalanceType, UNKNOWN_PAYMENT_METHOD, type PaymentMethodEvidence } from '../utils/payment-method';

export interface LedgerOptions {
    transactionId?: number;
    reference?: string;
    entryType?: string;
    metadata?: Record<string, any> | null;
    balanceType?: 'available' | 'pending';
    pendingReleaseAmountMinor?: number;
    paymentMethod?: PaymentMethodEvidence;
}

export interface Wallet {
    id: number;
    creator_id: number;
    balance: number;
    pending_balance: number;
    currency: string;
    created_at: string;
    updated_at: string;
}

class WalletRepositoryClass extends BaseRepository<Wallet, WalletModel> {
    constructor() {
        super(WalletModel);
    }

    async getByCreatorId(creatorId: number, currency = 'NGN', trx?: Transaction): Promise<Wallet | undefined> {
        return await WalletModel.query(trx).findOne({ creator_id: creatorId, currency });
    }

    async getAllByCreatorId(creatorId: number): Promise<Wallet[]> {
        return await WalletModel.query().where({ creator_id: creatorId }).orderBy("created_at", "asc");
    }

    async creditWallet(walletId: number, amount: number, trx?: Transaction, options: LedgerOptions = {}): Promise<Wallet> {
        const execute = async (db: Transaction) => {
            const wallet = await WalletModel.query(db).findById(walletId).forUpdate();
            if (!wallet) throw new Error("Wallet not found");
            const method = options.paymentMethod || UNKNOWN_PAYMENT_METHOD;
            const balanceType = options.balanceType || earningsBalanceType(wallet.currency, method);
            const column = balanceType === 'pending' ? 'pending_balance' : 'balance';
            const amountMinor = moneyToMinor(amount);
            if (amountMinor <= 0) throw new Error('Wallet credit must be positive');
            const netMinor = options.pendingReleaseAmountMinor ?? amountMinor;
            if (!Number.isSafeInteger(netMinor) || netMinor < 0 || netMinor > amountMinor) throw new Error('Invalid net wallet credit');
            const before = Number(wallet[column] || 0);
            const after = Number(minorToMoney(moneyToMinor(before) + amountMinor));
            const updated = await WalletModel.query(db).patchAndFetchById(walletId, { [column]: after } as any);
            await db("wallet_ledger_entries").insert({
                wallet_id: walletId,
                transaction_id: options.transactionId ?? null,
                reference: options.reference || `ledger_credit_${walletId}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
                entry_type: options.entryType || "credit",
                direction: "credit",
                balance_type: balanceType,
                amount: Number(amount),
                balance_before: before,
                balance_after: after,
                currency: wallet.currency,
                metadata: options.metadata || null,
            });
            if ((!options.balanceType || balanceType === 'pending') && options.transactionId) {
                const metadata: Record<string, unknown> = { payment_method: method };
                if (wallet.currency === 'USD' && balanceType === 'available') {
                    metadata.wallet_settlement = {
                        status: 'available', amount: minorToMoney(netMinor), currency: 'USD',
                        release_at: null, released_at: new Date().toISOString(),
                        business_days: 0, release_reason: 'confirmed_non_card',
                    };
                }
                await db('transactions').where({ id: options.transactionId }).update({
                    metadata: db.raw("coalesce(metadata, '{}'::jsonb) || ?::jsonb", [JSON.stringify(metadata)]),
                });
            }
            if (balanceType === 'pending') {
                if (wallet.currency !== 'USD' || !options.transactionId) throw new Error('Pending USD credits require a source transaction');
                await PendingWalletReleaseRepository.create(walletId, options.transactionId, netMinor, db, method);
            }
            return updated;
        };
        return trx ? execute(trx) : knex.transaction(execute);
    }

    async debitWallet(walletId: number, amount: number, trx?: Transaction, options: LedgerOptions = {}): Promise<Wallet> {
        const execute = async (db: Transaction) => {
            const wallet = await WalletModel.query(db).findById(walletId).forUpdate();
            if (!wallet) throw new Error("Wallet not found");
            const balanceType = options.balanceType || 'available';
            const column = balanceType === 'pending' ? 'pending_balance' : 'balance';
            const amountMinor = moneyToMinor(amount);
            if (amountMinor <= 0) throw new Error('Wallet debit must be positive');
            const before = Number(wallet[column] || 0);
            if (moneyToMinor(before) < amountMinor) throw new Error(`Insufficient ${balanceType} wallet balance`);
            const after = Number(minorToMoney(moneyToMinor(before) - amountMinor));
            const updated = await WalletModel.query(db).patchAndFetchById(walletId, { [column]: after } as any);
            await db("wallet_ledger_entries").insert({
                wallet_id: walletId,
                transaction_id: options.transactionId ?? null,
                reference: options.reference || `ledger_debit_${walletId}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
                entry_type: options.entryType || "debit",
                direction: "debit",
                balance_type: balanceType,
                amount: Number(amount),
                balance_before: before,
                balance_after: after,
                currency: wallet.currency,
                metadata: options.metadata || null,
            });
            return updated;
        };
        return trx ? execute(trx) : knex.transaction(execute);
    }

    async createForCreator(creatorId: number, currency = 'NGN', trx?: Transaction): Promise<Wallet> {
        return await WalletModel.query(trx).insert({
            creator_id: creatorId,
            balance: 0,
            pending_balance: 0,
            currency
        } as any);
    }
}

export const WalletRepository = new WalletRepositoryClass();
