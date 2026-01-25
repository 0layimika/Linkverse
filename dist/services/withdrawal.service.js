"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WithdrawalService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const WalletRepository_1 = require("../repositories/WalletRepository");
const TransactionRepository_1 = require("../repositories/TransactionRepository");
const BankAccountRepository_1 = require("../repositories/BankAccountRepository");
const CreatorRepository_1 = require("../repositories/CreatorRepository");
const wallet_service_1 = require("./wallet.service");
const PaymentProviderFactory_1 = require("../providers/PaymentProviderFactory");
const api_response_kit_1 = require("@0layimika/api-response-kit");
const knex_1 = __importDefault(require("../db/knex"));
const UserRepository_1 = require("../repositories/UserRepository");
const MINIMUM_WITHDRAWAL_AMOUNT = 1000; // 5000 Naira
const userRepo = new UserRepository_1.UserRepository();
class WithdrawalService {
    static generateReference() {
        return `withdraw_${Date.now()}_${crypto_1.default.randomBytes(8).toString('hex')}`;
    }
    static async getBanks() {
        try {
            const provider = (0, PaymentProviderFactory_1.getPaymentProvider)();
            const banks = await provider.getBanks();
            return (0, api_response_kit_1.Ok)(banks, "Banks retrieved successfully");
        }
        catch (err) {
            return (0, api_response_kit_1.InternalError)(err.message);
        }
    }
    static async resolveAccountNumber(accountNumber, bankCode) {
        try {
            const provider = (0, PaymentProviderFactory_1.getPaymentProvider)();
            const result = await provider.resolveAccountNumber({
                account_number: accountNumber,
                bank_code: bankCode,
            });
            return (0, api_response_kit_1.Ok)(result, "Account resolved successfully");
        }
        catch (err) {
            return (0, api_response_kit_1.InternalError)(err.message);
        }
    }
    static async setBankAccount(userId, data) {
        try {
            const creator = await CreatorRepository_1.CreatorRepository.getOneWhere({ user_id: userId });
            if (!creator) {
                return (0, api_response_kit_1.NotFound)("Creator profile not found");
            }
            const provider = (0, PaymentProviderFactory_1.getPaymentProvider)();
            // Resolve account to get account name
            const resolveResult = await provider.resolveAccountNumber({
                account_number: data.account_number,
                bank_code: data.bank_code,
            });
            if (!resolveResult.success) {
                return (0, api_response_kit_1.BadRequest)("Could not resolve account number");
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
                return (0, api_response_kit_1.BadRequest)("Could not create transfer recipient");
            }
            // Save bank account
            const bankAccount = await BankAccountRepository_1.BankAccountRepository.upsertForCreator(creator.id, {
                account_number: data.account_number,
                account_name: resolveResult.account_name,
                bank_code: data.bank_code,
                bank_name: bank?.name || data.bank_code,
                recipient_code: recipientResult.recipient_code,
                provider: provider.providerName,
            });
            return (0, api_response_kit_1.Ok)(bankAccount, "Bank account saved successfully");
        }
        catch (err) {
            return (0, api_response_kit_1.InternalError)(err.message);
        }
    }
    static async getBankAccount(userId) {
        try {
            const creator = await CreatorRepository_1.CreatorRepository.getOneWhere({ user_id: userId });
            if (!creator) {
                return (0, api_response_kit_1.NotFound)("Creator profile not found");
            }
            const bankAccount = await BankAccountRepository_1.BankAccountRepository.getByCreatorId(creator.id);
            if (!bankAccount) {
                return (0, api_response_kit_1.NotFound)("No bank account set");
            }
            return (0, api_response_kit_1.Ok)(bankAccount, "Bank account retrieved successfully");
        }
        catch (err) {
            return (0, api_response_kit_1.InternalError)(err.message);
        }
    }
    static async initiateWithdrawal(userId, data) {
        const trx = await knex_1.default.transaction();
        try {
            const creator = await CreatorRepository_1.CreatorRepository.getOneWhere({ user_id: userId }, { user: true });
            if (!creator) {
                await trx.rollback();
                return (0, api_response_kit_1.NotFound)("Creator profile not found");
            }
            const user = await userRepo.getOneWhere({ id: creator.user_id });
            if (!user) {
                await trx.rollback();
                return (0, api_response_kit_1.NotFound)("User not found");
            }
            const wallet = await wallet_service_1.WalletService.getOrCreateWallet(creator.id);
            // Check minimum amount
            if (data.amount < MINIMUM_WITHDRAWAL_AMOUNT) {
                await trx.rollback();
                return (0, api_response_kit_1.BadRequest)(`Minimum withdrawal amount is ${MINIMUM_WITHDRAWAL_AMOUNT} Naira`);
            }
            // Check wallet balance
            if (wallet.balance < data.amount) {
                await trx.rollback();
                return (0, api_response_kit_1.BadRequest)("Insufficient balance");
            }
            // Get bank account
            const bankAccount = await BankAccountRepository_1.BankAccountRepository.getByCreatorId(creator.id);
            if (!bankAccount) {
                await trx.rollback();
                return (0, api_response_kit_1.BadRequest)("Please set up your bank account for withdrawal");
            }
            const provider = (0, PaymentProviderFactory_1.getPaymentProvider)();
            // Check if recipient code needs to be recreated for different provider
            if (bankAccount.provider !== provider.providerName) {
                const recipientResult = await provider.createTransferRecipient({
                    account_number: bankAccount.account_number,
                    account_name: bankAccount.account_name,
                    bank_code: bankAccount.bank_code,
                });
                if (!recipientResult.success) {
                    await trx.rollback();
                    return (0, api_response_kit_1.BadRequest)("Could not create transfer recipient");
                }
                await BankAccountRepository_1.BankAccountRepository.update(bankAccount.id, {
                    recipient_code: recipientResult.recipient_code,
                    provider: provider.providerName,
                });
                bankAccount.recipient_code = recipientResult.recipient_code;
            }
            const reference = this.generateReference();
            const amountInKobo = data.amount * 100;
            // Debit wallet
            await WalletRepository_1.WalletRepository.debitWallet(wallet.id, data.amount, trx);
            // Create pending transaction
            const transaction = await TransactionRepository_1.TransactionRepository.create({
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
            }, {}, trx);
            // Initiate transfer
            const transferResult = await provider.initiateTransfer({
                amount: amountInKobo,
                recipient_code: bankAccount.recipient_code,
                reference,
                reason: 'CreatorLink Withdrawal',
                email: user.email || '',
            });
            if (!transferResult.success) {
                await trx.rollback();
                return (0, api_response_kit_1.BadRequest)("Failed to initiate transfer");
            }
            await trx.commit();
            return (0, api_response_kit_1.Ok)({
                transaction_id: transaction.id,
                reference,
                status: transferResult.status,
                amount: data.amount,
            }, "Withdrawal initiated successfully");
        }
        catch (err) {
            await trx.rollback();
            return (0, api_response_kit_1.InternalError)(err.message);
        }
    }
    static async getWithdrawalHistory(userId, limit = 50, offset = 0) {
        try {
            const creator = await CreatorRepository_1.CreatorRepository.getOneWhere({ user_id: userId });
            if (!creator) {
                return (0, api_response_kit_1.NotFound)("Creator profile not found");
            }
            const wallet = await wallet_service_1.WalletService.getOrCreateWallet(creator.id);
            const withdrawals = await TransactionRepository_1.TransactionRepository.getWithdrawalsForWallet(wallet.id, limit, offset);
            return (0, api_response_kit_1.Ok)(withdrawals, "Withdrawal history retrieved successfully");
        }
        catch (err) {
            return (0, api_response_kit_1.InternalError)(err.message);
        }
    }
}
exports.WithdrawalService = WithdrawalService;
//# sourceMappingURL=withdrawal.service.js.map