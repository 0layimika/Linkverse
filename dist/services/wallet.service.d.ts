export declare class WalletService {
    static getOrCreateWallet(creatorId: number): Promise<import("../repositories/WalletRepository").Wallet>;
    static getMyWallet(userId: number): Promise<import("@0layimika/api-response-kit").ApiError | import("@0layimika/api-response-kit").ApiSuccess<import("../repositories/WalletRepository").Wallet>>;
    static getWalletBalance(userId: number): Promise<import("@0layimika/api-response-kit").ApiError | import("@0layimika/api-response-kit").ApiSuccess<{
        balance: number;
        currency: string;
    }>>;
    static getTransactionHistory(userId: number, type?: 'gift' | 'withdrawal', limit?: number, offset?: number): Promise<import("@0layimika/api-response-kit").ApiError | import("@0layimika/api-response-kit").ApiSuccess<import("../repositories/TransactionRepository").TransactionRecord[]>>;
    static creditWallet(walletId: number, amount: number, transactionId: number): Promise<import("../repositories/WalletRepository").Wallet>;
}
//# sourceMappingURL=wallet.service.d.ts.map