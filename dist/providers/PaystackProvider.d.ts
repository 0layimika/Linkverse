import { PaymentProvider } from './PaymentProvider';
import { InitializePaymentParams, InitializePaymentResponse, VerifyPaymentResponse, Bank, ResolveAccountParams, ResolveAccountResponse, CreateTransferRecipientParams, CreateTransferRecipientResponse, InitiateTransferParams, InitiateTransferResponse, WebhookEvent } from '../types/payment.types';
export declare class PaystackProvider extends PaymentProvider {
    readonly providerName = "paystack";
    private readonly secretKey;
    private readonly baseUrl;
    constructor();
    private request;
    initializePayment(params: InitializePaymentParams): Promise<InitializePaymentResponse>;
    verifyPayment(reference: string): Promise<VerifyPaymentResponse>;
    getBanks(): Promise<Bank[]>;
    resolveAccountNumber(params: ResolveAccountParams): Promise<ResolveAccountResponse>;
    createTransferRecipient(params: CreateTransferRecipientParams): Promise<CreateTransferRecipientResponse>;
    initiateTransfer(params: InitiateTransferParams): Promise<InitiateTransferResponse>;
    verifyWebhookSignature(payload: string, signature: string): boolean;
    parseWebhookEvent(body: any): WebhookEvent;
}
//# sourceMappingURL=PaystackProvider.d.ts.map