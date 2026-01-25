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

class TransactionRepositoryClass extends BaseRepository<TransactionRecord, TransactionModel> {
    constructor() {
        super(TransactionModel);
    }

    async getByReference(reference: string): Promise<TransactionRecord | undefined> {
        return await TransactionModel.query().findOne({ reference });
    }

    async getByProviderReference(providerReference: string): Promise<TransactionRecord | undefined> {
        return await TransactionModel.query().findOne({ provider_reference: providerReference });
    }

    async updateStatus(id: number, status: TransactionStatus, providerReference?: string, trx?: Transaction): Promise<TransactionRecord> {
        const updateData: any = { status };
        if (providerReference) {
            updateData.provider_reference = providerReference;
        }
        return await TransactionModel.query(trx).patchAndFetchById(id, updateData);
    }

    async getTransactionsForWallet(walletId: number, limit = 50, offset = 0): Promise<TransactionRecord[]> {
        return await TransactionModel.query()
            .where({ wallet_id: walletId })
            .orderBy('created_at', 'desc')
            .limit(limit)
            .offset(offset);
    }

    async getGiftsForWallet(walletId: number, limit = 50, offset = 0): Promise<TransactionRecord[]> {
        return await TransactionModel.query()
            .where({ wallet_id: walletId, type: 'gift' })
            .orderBy('created_at', 'desc')
            .limit(limit)
            .offset(offset);
    }

    async getWithdrawalsForWallet(walletId: number, limit = 50, offset = 0): Promise<TransactionRecord[]> {
        return await TransactionModel.query()
            .where({ wallet_id: walletId, type: 'withdrawal' })
            .orderBy('created_at', 'desc')
            .limit(limit)
            .offset(offset);
    }
}

export const TransactionRepository = new TransactionRepositoryClass();
