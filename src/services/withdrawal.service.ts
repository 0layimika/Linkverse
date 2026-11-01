import crypto from 'crypto';
import { WithdrawalQuoteService } from './withdrawal-quote.service';
import { BankAccountRepository } from "../repositories/BankAccountRepository";
import { CreatorRepository } from "../repositories/CreatorRepository";
import { getPaymentProvider } from "../providers/PaymentProviderFactory";
import { BadRequest, InternalError, NotFound, Ok } from "@0layimika/api-response-kit";

export interface SetBankAccountData {
    account_number: string;
    bank_code: string;
}

export interface WithdrawalData {
    quote_id: string;
    password: string;
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

    static async quoteWithdrawal(userId: number, data: { amount: number; currency?: 'NGN' | 'USD' }) {
        return WithdrawalQuoteService.quote(userId, data);
    }

    static async initiateWithdrawal(userId: number, data: WithdrawalData) {
        return WithdrawalQuoteService.execute(userId, data);
    }

    static async getWithdrawalHistory(userId: number, limit = 50, offset = 0) {
        return WithdrawalQuoteService.history(userId, limit, offset);
    }
}
