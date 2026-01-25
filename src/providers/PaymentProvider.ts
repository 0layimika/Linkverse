import {
    InitializePaymentParams,
    InitializePaymentResponse,
    VerifyPaymentResponse,
    Bank,
    ResolveAccountParams,
    ResolveAccountResponse,
    CreateTransferRecipientParams,
    CreateTransferRecipientResponse,
    InitiateTransferParams,
    InitiateTransferResponse,
    WebhookEvent,
} from '../types/payment.types';

export abstract class PaymentProvider {
    abstract readonly providerName: string;

    abstract initializePayment(params: InitializePaymentParams): Promise<InitializePaymentResponse>;

    abstract verifyPayment(reference: string): Promise<VerifyPaymentResponse>;

    abstract getBanks(): Promise<Bank[]>;

    abstract resolveAccountNumber(params: ResolveAccountParams): Promise<ResolveAccountResponse>;

    abstract createTransferRecipient(params: CreateTransferRecipientParams): Promise<CreateTransferRecipientResponse>;

    abstract initiateTransfer(params: InitiateTransferParams): Promise<InitiateTransferResponse>;

    abstract verifyWebhookSignature(payload: string, signature: string): boolean;

    abstract parseWebhookEvent(body: any): WebhookEvent;
}
