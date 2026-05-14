import { BaseRepository } from "./BaseRepository";
import { WalletModel } from "../models/WalletModel";
import { Transaction } from "objection";

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

    async getByCreatorId(creatorId: number): Promise<Wallet | undefined> {
        return await WalletModel.query().findOne({ creator_id: creatorId });
    }

    async getAllByCreatorId(creatorId: number): Promise<Wallet[]> {
        return await WalletModel.query().where({ creator_id: creatorId }).orderBy("created_at", "asc");
    }

    async creditWallet(walletId: number, amount: number, trx?: Transaction): Promise<Wallet> {
        return await WalletModel.query(trx)
            .patchAndFetchById(walletId, {
                balance: WalletModel.raw('balance + ?', [amount])
            } as any);
    }

    async debitWallet(walletId: number, amount: number, trx?: Transaction): Promise<Wallet> {
        return await WalletModel.query(trx)
            .patchAndFetchById(walletId, {
                balance: WalletModel.raw('balance - ?', [amount])
            } as any);
    }

    async createForCreator(creatorId: number, trx?: Transaction): Promise<Wallet> {
        return await WalletModel.query(trx).insert({
            creator_id: creatorId,
            balance: 0,
            currency: 'NGN'
        } as any);
    }
}

export const WalletRepository = new WalletRepositoryClass();
