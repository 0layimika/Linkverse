import { BaseRepository } from "./BaseRepository";
import { WalletModel } from "../models/WalletModel";
import { Transaction } from "objection";
import knex from "../db/knex";

export interface LedgerOptions {
    transactionId?: number;
    reference?: string;
    entryType?: string;
    metadata?: Record<string, any> | null;
}

export interface Wallet {
    id: number;
    creator_id: number;
    balance: number;
    currency: string;
    created_at: string;
    updated_at: string;
}

class WalletRepositoryClass extends BaseRepository<Wallet, WalletModel> {
    constructor() {
        super(WalletModel);
    }

    async getByCreatorId(creatorId: number, currency = 'NGN'): Promise<Wallet | undefined> {
        return await WalletModel.query().findOne({ creator_id: creatorId, currency });
    }

    async getAllByCreatorId(creatorId: number): Promise<Wallet[]> {
        return await WalletModel.query().where({ creator_id: creatorId }).orderBy("created_at", "asc");
    }

    async creditWallet(walletId: number, amount: number, trx?: Transaction, options: LedgerOptions = {}): Promise<Wallet> {
        const execute = async (db: Transaction) => {
            const wallet = await WalletModel.query(db).findById(walletId).forUpdate();
            if (!wallet) throw new Error("Wallet not found");
            const before = Number(wallet.balance || 0);
            const after = Number((before + Number(amount)).toFixed(2));
            const updated = await WalletModel.query(db).patchAndFetchById(walletId, { balance: after } as any);
            await db("wallet_ledger_entries").insert({
                wallet_id: walletId,
                transaction_id: options.transactionId ?? null,
                reference: options.reference || `ledger_credit_${walletId}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
                entry_type: options.entryType || "credit",
                direction: "credit",
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

    async debitWallet(walletId: number, amount: number, trx?: Transaction, options: LedgerOptions = {}): Promise<Wallet> {
        const execute = async (db: Transaction) => {
            const wallet = await WalletModel.query(db).findById(walletId).forUpdate();
            if (!wallet) throw new Error("Wallet not found");
            const before = Number(wallet.balance || 0);
            if (before < Number(amount)) throw new Error("Insufficient wallet balance");
            const after = Number((before - Number(amount)).toFixed(2));
            const updated = await WalletModel.query(db).patchAndFetchById(walletId, { balance: after } as any);
            await db("wallet_ledger_entries").insert({
                wallet_id: walletId,
                transaction_id: options.transactionId ?? null,
                reference: options.reference || `ledger_debit_${walletId}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
                entry_type: options.entryType || "debit",
                direction: "debit",
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
            currency
        } as any);
    }
}

export const WalletRepository = new WalletRepositoryClass();
