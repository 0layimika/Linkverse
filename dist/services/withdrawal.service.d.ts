export interface SetBankAccountData {
    account_number: string;
    bank_code: string;
}
export interface WithdrawalData {
    amount: number;
}
export declare class WithdrawalService {
    static generateReference(): string;
    static getBanks(): Promise<import("@0layimika/api-response-kit").ApiError | import("@0layimika/api-response-kit").ApiSuccess<import("../types/payment.types").Bank[]>>;
    static resolveAccountNumber(accountNumber: string, bankCode: string): Promise<import("@0layimika/api-response-kit").ApiError | import("@0layimika/api-response-kit").ApiSuccess<import("../types/payment.types").ResolveAccountResponse>>;
    static setBankAccount(userId: number, data: SetBankAccountData): Promise<import("@0layimika/api-response-kit").ApiError | import("@0layimika/api-response-kit").ApiSuccess<import("../repositories/BankAccountRepository").BankAccount>>;
    static getBankAccount(userId: number): Promise<import("@0layimika/api-response-kit").ApiError | import("@0layimika/api-response-kit").ApiSuccess<import("../repositories/BankAccountRepository").BankAccount>>;
    static initiateWithdrawal(userId: number, data: WithdrawalData): Promise<import("@0layimika/api-response-kit").ApiError | import("@0layimika/api-response-kit").ApiSuccess<{
        transaction_id: number;
        reference: string;
        status: "success" | "pending" | "failed";
        amount: number;
    }>>;
    static getWithdrawalHistory(userId: number, limit?: number, offset?: number): Promise<import("@0layimika/api-response-kit").ApiError | import("@0layimika/api-response-kit").ApiSuccess<import("../repositories/TransactionRepository").TransactionRecord[]>>;
}
//# sourceMappingURL=withdrawal.service.d.ts.map