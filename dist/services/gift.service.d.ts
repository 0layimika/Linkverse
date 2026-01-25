export interface InitiateGiftData {
    amount: number;
    sender_name?: string;
    sender_email: string;
    description?: string;
}
export declare class GiftService {
    static generateReference(): string;
    static initiateGift(creatorUsername: string, data: InitiateGiftData): Promise<import("@0layimika/api-response-kit").ApiError | import("@0layimika/api-response-kit").ApiSuccess<{
        authorization_url: string;
        reference: string;
        transaction_id: number;
    }>>;
    static verifyGiftPayment(reference: string): Promise<import("@0layimika/api-response-kit").ApiError | import("@0layimika/api-response-kit").ApiSuccess<{
        status: string;
    }>>;
    private static sendTipNotification;
    static handleWebhook(_provider: 'paystack' | 'kora', payload: string, signature: string, body: any): Promise<import("@0layimika/api-response-kit").ApiError | import("@0layimika/api-response-kit").ApiSuccess<null>>;
}
//# sourceMappingURL=gift.service.d.ts.map