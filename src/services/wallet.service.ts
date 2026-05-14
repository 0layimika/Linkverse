import { WalletRepository } from "../repositories/WalletRepository";
import { TransactionRepository } from "../repositories/TransactionRepository";
import { CreatorRepository } from "../repositories/CreatorRepository";
import { InternalError, NotFound, Ok } from "@0layimika/api-response-kit";
import knex from "../db/knex";

export class WalletService {
    static async getOrCreateWallet(creatorId: number) {
        try {
            let wallet = await WalletRepository.getByCreatorId(creatorId);
            if (!wallet) {
                wallet = await WalletRepository.createForCreator(creatorId);
            }
            return wallet;
        } catch (err: any) {
            throw new Error(`Failed to get/create wallet: ${err.message}`);
        }
    }

    static async getMyWallet(userId: number) {
        try {
            const creator = await CreatorRepository.getOneWhere({ user_id: userId });
            if (!creator) {
                return NotFound("Creator profile not found");
            }

            const wallet = await this.getOrCreateWallet(creator.id);
            return Ok(wallet, "Wallet retrieved successfully");
        } catch (err: any) {
            return InternalError(err.message);
        }
    }

    static async getWalletBalance(userId: number) {
        try {
            const creator = await CreatorRepository.getOneWhere({ user_id: userId });
            if (!creator) {
                return NotFound("Creator profile not found");
            }

            const wallet = await this.getOrCreateWallet(creator.id);
            return Ok({ balance: wallet.balance, currency: wallet.currency }, "Balance retrieved successfully");
        } catch (err: any) {
            return InternalError(err.message);
        }
    }

    static async getTransactionHistory(userId: number, type?: 'gift' | 'withdrawal', limit = 50, offset = 0) {
        try {
            const creator = await CreatorRepository.getOneWhere({ user_id: userId });
            if (!creator) {
                return NotFound("Creator profile not found");
            }

            const wallets = await WalletRepository.getAllByCreatorId(creator.id);
            if (!wallets.length) {
                const wallet = await this.getOrCreateWallet(creator.id);
                wallets.push(wallet);
            }
            const walletIds = wallets.map((w) => w.id);

            let transactions;
            if (type === 'gift') {
                transactions = await TransactionRepository.getGiftsForWallets(walletIds, limit, offset);
            } else if (type === 'withdrawal') {
                transactions = await TransactionRepository.getWithdrawalsForWallets(walletIds, limit, offset);
            } else {
                transactions = await TransactionRepository.getTransactionsForWallets(walletIds, limit, offset);
            }

            return Ok(transactions, "Transactions retrieved successfully");
        } catch (err: any) {
            return InternalError(err.message);
        }
    }

    static async creditWallet(walletId: number, amount: number, transactionId: number) {
        const trx = await knex.transaction();
        try {
            const wallet = await WalletRepository.creditWallet(walletId, amount, trx);
            await TransactionRepository.updateStatus(transactionId, 'completed', undefined, trx);
            await trx.commit();
            return wallet;
        } catch (err: any) {
            await trx.rollback();
            throw new Error(`Failed to credit wallet: ${err.message}`);
        }
    }
}
