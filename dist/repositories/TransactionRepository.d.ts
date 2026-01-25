import { BaseRepository } from "./BaseRepository";
import { TransactionModel, TransactionStatus, TransactionType } from "../models/TransactionModel";
import { Transaction } from "objection";
export interface TransactionRecord {
    id: number;
    wallet_id: number;
    type: TransactionType;
    amount: number;
    currency: string;
    status: TransactionStatus;
    reference: string;
    provider: string;
    provider_reference: string | null;
    description: string | null;
    sender_name: string | null;
    sender_email: string | null;
    metadata: Record<string, any> | null;
    created_at: string;
    updated_at: string;
}
declare class TransactionRepositoryClass extends BaseRepository<TransactionRecord, TransactionModel> {
    constructor();
    getByReference(reference: string): Promise<TransactionRecord | undefined>;
    getByProviderReference(providerReference: string): Promise<TransactionRecord | undefined>;
    updateStatus(id: number, status: TransactionStatus, providerReference?: string, trx?: Transaction): Promise<TransactionRecord>;
    getTransactionsForWallet(walletId: number, limit?: number, offset?: number): Promise<TransactionRecord[]>;
    getGiftsForWallet(walletId: number, limit?: number, offset?: number): Promise<TransactionRecord[]>;
    getWithdrawalsForWallet(walletId: number, limit?: number, offset?: number): Promise<TransactionRecord[]>;
}
export declare const TransactionRepository: TransactionRepositoryClass;
export {};
//# sourceMappingURL=TransactionRepository.d.ts.map