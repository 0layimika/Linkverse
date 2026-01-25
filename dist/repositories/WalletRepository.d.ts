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
declare class WalletRepositoryClass extends BaseRepository<Wallet, WalletModel> {
    constructor();
    getByCreatorId(creatorId: number): Promise<Wallet | undefined>;
    creditWallet(walletId: number, amount: number, trx?: Transaction): Promise<Wallet>;
    debitWallet(walletId: number, amount: number, trx?: Transaction): Promise<Wallet>;
    createForCreator(creatorId: number, trx?: Transaction): Promise<Wallet>;
}
export declare const WalletRepository: WalletRepositoryClass;
export {};
//# sourceMappingURL=WalletRepository.d.ts.map