import crypto from 'crypto';
import { PaymentProvider } from './PaymentProvider';
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

export class PaystackProvider extends PaymentProvider {
    readonly providerName = 'paystack';
    private readonly secretKey: string;
    private readonly baseUrl = 'https://api.paystack.co';

    constructor() {
        super();
        this.secretKey = process.env.PAYSTACK_SECRET_KEY || '';
    }

    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            ...options,
            headers: {
                Authorization: `Bearer ${this.secretKey}`,
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        const data = await response.json() as T & { message?: string };

        if (!response.ok) {
            throw new Error(data.message || 'Paystack API error');
        }

        return data;
    }

    async initializePayment(params: InitializePaymentParams): Promise<InitializePaymentResponse> {
        const response = await this.request<{
            status: boolean;
            data: {
                authorization_url: string;
                access_code: string;
                reference: string;
            };
        }>('/transaction/initialize', {
            method: 'POST',
            body: JSON.stringify({
                amount: params.amount,
                email: params.email,
                reference: params.reference,
                metadata: params.metadata,
                callback_url: params.callback_url,
            }),
        });

        return {
            success: response.status,
            authorization_url: response.data.authorization_url,
            access_code: response.data.access_code,
            reference: response.data.reference,
        };
    }

    async verifyPayment(reference: string): Promise<VerifyPaymentResponse> {
        const response = await this.request<{
            status: boolean;
            data: {
                status: string;
                amount: number;
                reference: string;
                id: number;
                metadata?: Record<string, any>;
            };
        }>(`/transaction/verify/${reference}`);

        return {
            success: response.status,
            status: response.data.status === 'success' ? 'success' :
                   response.data.status === 'failed' ? 'failed' : 'pending',
            amount: response.data.amount,
            reference: response.data.reference,
            provider_reference: String(response.data.id),
            metadata: response.data.metadata,
        };
    }

    async getBanks(): Promise<Bank[]> {
        const response = await this.request<{
            status: boolean;
            data: Array<{ name: string; code: string }>;
        }>('/bank?country=nigeria');

        return response.data.map(bank => ({
            name: bank.name,
            code: bank.code,
        }));
    }

    async resolveAccountNumber(params: ResolveAccountParams): Promise<ResolveAccountResponse> {
        const response = await this.request<{
            status: boolean;
            data: {
                account_number: string;
                account_name: string;
            };
        }>(`/bank/resolve?account_number=${params.account_number}&bank_code=${params.bank_code}`);

        return {
            success: response.status,
            account_number: response.data.account_number,
            account_name: response.data.account_name,
            bank_code: params.bank_code,
        };
    }

    async createTransferRecipient(params: CreateTransferRecipientParams): Promise<CreateTransferRecipientResponse> {
        const response = await this.request<{
            status: boolean;
            data: {
                recipient_code: string;
            };
        }>('/transferrecipient', {
            method: 'POST',
            body: JSON.stringify({
                type: 'nuban',
                name: params.account_name,
                account_number: params.account_number,
                bank_code: params.bank_code,
                currency: 'NGN',
            }),
        });

        return {
            success: response.status,
            recipient_code: response.data.recipient_code,
        };
    }

    async initiateTransfer(params: InitiateTransferParams): Promise<InitiateTransferResponse> {
        const response = await this.request<{
            status: boolean;
            data: {
                transfer_code: string;
                reference: string;
                status: string;
            };
        }>('/transfer', {
            method: 'POST',
            body: JSON.stringify({
                source: 'balance',
                amount: params.amount,
                recipient: params.recipient_code,
                reference: params.reference,
                reason: params.reason,
            }),
        });

        return {
            success: response.status,
            transfer_code: response.data.transfer_code,
            reference: response.data.reference,
            status: response.data.status === 'success' ? 'success' :
                   response.data.status === 'failed' ? 'failed' : 'pending',
        };
    }

    verifyWebhookSignature(payload: string, signature: string): boolean {
        const hash = crypto
            .createHmac('sha512', this.secretKey)
            .update(payload)
            .digest('hex');
        return hash === signature;
    }

    parseWebhookEvent(body: any): WebhookEvent {
        return {
            event: body.event,
            data: {
                reference: body.data.reference,
                status: body.data.status,
                amount: body.data.amount,
                ...body.data,
            },
        };
    }
}
