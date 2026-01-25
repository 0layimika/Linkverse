import crypto from 'crypto';
import { WalletRepository } from "../repositories/WalletRepository";
import { TransactionRepository } from "../repositories/TransactionRepository";
import { BankAccountRepository } from "../repositories/BankAccountRepository";
import { CreatorRepository } from "../repositories/CreatorRepository";
import { WalletService } from "./wallet.service";
import { getPaymentProvider } from "../providers/PaymentProviderFactory";
import { BadRequest, InternalError, NotFound, Ok } from "@0layimika/api-response-kit";
import knex from "../db/knex";
import { UserRepository } from '../repositories/UserRepository';

const MINIMUM_WITHDRAWAL_AMOUNT = 1000; // 5000 Naira
const userRepo = new UserRepository();
export interface SetBankAccountData {
    account_number: string;
    bank_code: string;
}

export interface WithdrawalData {
    amount: number; // in naira
}

export class WithdrawalService {
    static generateReference(): string {
        return `withdraw_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    }

    static async getBanks() {
        try {
            const provider = getPaymentProvider();
            const banks = await provider.getBanks();
            return Ok(banks, "Banks retrieved successfully");
        } catch (err: any) {
            return InternalError(err.message);
        }
    }

    static async resolveAccountNumber(accountNumber: string, bankCode: string) {
        try {
            const provider = getPaymentProvider();
            const result = await provider.resolveAccountNumber({
                account_number: accountNumber,
                bank_code: bankCode,
            });
            return Ok(result, "Account resolved successfully");
        } catch (err: any) {
            return InternalError(err.message);
        }
    }

    static async setBankAccount(userId: number, data: SetBankAccountData) {
        try {
            const creator = await CreatorRepository.getOneWhere({ user_id: userId });
            if (!creator) {
                return NotFound("Creator profile not found");
            }

            const provider = getPaymentProvider();

            // Resolve account to get account name
            const resolveResult = await provider.resolveAccountNumber({
                account_number: data.account_number,
                bank_code: data.bank_code,
            });

            if (!resolveResult.success) {
                return BadRequest("Could not resolve account number");
            }

            // Get bank name from the bank code
            const banks = await provider.getBanks();
            const bank = banks.find(b => b.code === data.bank_code);

            // Create transfer recipient
            const recipientResult = await provider.createTransferRecipient({
                account_number: data.account_number,
                account_name: resolveResult.account_name,
                bank_code: data.bank_code,
            });

            if (!recipientResult.success) {
                return BadRequest("Could not create transfer recipient");
            }

            // Save bank account
            const bankAccount = await BankAccountRepository.upsertForCreator(creator.id, {
                account_number: data.account_number,
                account_name: resolveResult.account_name,
                bank_code: data.bank_code,
                bank_name: bank?.name || data.bank_code,
                recipient_code: recipientResult.recipient_code,
                provider: provider.providerName,
            });

            return Ok(bankAccount, "Bank account saved successfully");
        } catch (err: any) {
            return InternalError(err.message);
        }
    }

    static async getBankAccount(userId: number) {
        try {
            const creator = await CreatorRepository.getOneWhere({ user_id: userId });
            if (!creator) {
                return NotFound("Creator profile not found");
            }

            const bankAccount = await BankAccountRepository.getByCreatorId(creator.id);
            if (!bankAccount) {
                return NotFound("No bank account set");
            }

            return Ok(bankAccount, "Bank account retrieved successfully");
        } catch (err: any) {
            return InternalError(err.message);
        }
    }

    static async initiateWithdrawal(userId: number, data: WithdrawalData) {
        const trx = await knex.transaction();
        try {
            const creator = await CreatorRepository.getOneWhere({ user_id: userId }, { user: true });
            if (!creator) {
                await trx.rollback();
                return NotFound("Creator profile not found");
            }
            const user = await userRepo.getOneWhere({ id: creator.user_id });
            if (!user) {
                await trx.rollback();
                return NotFound("User not found");
            }

            const wallet = await WalletService.getOrCreateWallet(creator.id);

            // Check minimum amount
            if (data.amount < MINIMUM_WITHDRAWAL_AMOUNT) {
                await trx.rollback();
                return BadRequest(`Minimum withdrawal amount is ${MINIMUM_WITHDRAWAL_AMOUNT} Naira`);
            }

            // Check wallet balance
            if (wallet.balance < data.amount) {
                await trx.rollback();
                return BadRequest("Insufficient balance");
            }

            // Get bank account
            const bankAccount = await BankAccountRepository.getByCreatorId(creator.id);
            if (!bankAccount) {
                await trx.rollback();
                return BadRequest("Please set up your bank account for withdrawal");
            }

            const provider = getPaymentProvider();

            // Check if recipient code needs to be recreated for different provider
            if (bankAccount.provider !== provider.providerName) {
                const recipientResult = await provider.createTransferRecipient({
                    account_number: bankAccount.account_number,
                    account_name: bankAccount.account_name,
                    bank_code: bankAccount.bank_code,
                });

                if (!recipientResult.success) {
                    await trx.rollback();
                    return BadRequest("Could not create transfer recipient");
                }

                await BankAccountRepository.update(bankAccount.id, {
                    recipient_code: recipientResult.recipient_code,
                    provider: provider.providerName,
                });

                bankAccount.recipient_code = recipientResult.recipient_code;
            }

            const reference = this.generateReference();
            const amountInKobo = data.amount * 100;

            // Debit wallet
            await WalletRepository.debitWallet(wallet.id, data.amount, trx);

            // Create pending transaction
            const transaction = await TransactionRepository.create({
                wallet_id: wallet.id,
                type: 'withdrawal',
                amount: data.amount,
                currency: 'NGN',
                status: 'completed',
                reference,
                provider: provider.providerName,
                description: `Withdrawal to ${bankAccount.bank_name} - ${bankAccount.account_number}`,
                metadata: {
                    bank_name: bankAccount.bank_name,
                    account_number: bankAccount.account_number,
                    account_name: bankAccount.account_name,
                },
            } as any, {}, trx);

            // Initiate transfer
            const transferResult = await provider.initiateTransfer({
                amount: amountInKobo,
                recipient_code: bankAccount.recipient_code!,
                reference,
                reason: 'CreatorLink Withdrawal',
                email: user.email || '',
            });

            if (!transferResult.success) {
                await trx.rollback();
                return BadRequest("Failed to initiate transfer");
            }

            await trx.commit();

            return Ok({
                transaction_id: transaction.id,
                reference,
                status: transferResult.status,
                amount: data.amount,
            }, "Withdrawal initiated successfully");
        } catch (err: any) {
            await trx.rollback();
            return InternalError(err.message);
        }
    }

    static async getWithdrawalHistory(userId: number, limit = 50, offset = 0) {
        try {
            const creator = await CreatorRepository.getOneWhere({ user_id: userId });
            if (!creator) {
                return NotFound("Creator profile not found");
            }

            const wallet = await WalletService.getOrCreateWallet(creator.id);
            const withdrawals = await TransactionRepository.getWithdrawalsForWallet(wallet.id, limit, offset);

            return Ok(withdrawals, "Withdrawal history retrieved successfully");
        } catch (err: any) {
            return InternalError(err.message);
        }
    }
}
