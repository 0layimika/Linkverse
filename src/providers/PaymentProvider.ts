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
    TransferQuote,
} from '../types/payment.types';
import { paymentMethodFromData, type PaymentMethodEvidence } from '../utils/payment-method';

export abstract class PaymentProvider {
    abstract readonly providerName: string;

    abstract initializePayment(params: InitializePaymentParams): Promise<InitializePaymentResponse>;

    abstract verifyPayment(reference: string): Promise<VerifyPaymentResponse>;

    async resolvePaymentMethod(data: unknown, _reference?: string): Promise<PaymentMethodEvidence> {
        return paymentMethodFromData(data);
    }

    abstract getBanks(): Promise<Bank[]>;

    abstract resolveAccountNumber(params: ResolveAccountParams): Promise<ResolveAccountResponse>;

    abstract createTransferRecipient(params: CreateTransferRecipientParams): Promise<CreateTransferRecipientResponse>;

    abstract initiateTransfer(params: InitiateTransferParams): Promise<InitiateTransferResponse>;

    async quoteTransfer(_amount: string, _currency: string, _reference: string): Promise<TransferQuote> {
        throw new Error('This provider does not support currency conversion quotes');
    }

    async findTransfer(_reference: string): Promise<InitiateTransferResponse | null> {
        throw new Error('This provider does not support payout reconciliation');
    }

    async validateTransferRecipient(_recipientCode: string): Promise<void> {}

    abstract verifyWebhookSignature(payload: string, signature: string, timestamp?: string): boolean;

    abstract parseWebhookEvent(body: any): WebhookEvent;
}
