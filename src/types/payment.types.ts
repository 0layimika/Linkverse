export interface InitializePaymentParams {
    amount: number; // in kobo/smallest unit
    email: string;
    reference: string;
    metadata?: Record<string, any>;
    callback_url?: string;
}

export interface InitializePaymentResponse {
    success: boolean;
    authorization_url: string;
    access_code?: string;
    reference: string;
}

export interface VerifyPaymentResponse {
    success: boolean;
    status: 'success' | 'failed' | 'pending';
    amount: number;
    reference: string;
    provider_reference?: string;
    metadata?: Record<string, any>;
}

export interface Bank {
    name: string;
    code: string;
}

export interface ResolveAccountParams {
    account_number: string;
    bank_code: string;
}

export interface ResolveAccountResponse {
    success: boolean;
    account_number: string;
    account_name: string;
    bank_code: string;
}

export interface CreateTransferRecipientParams {
    account_number: string;
    account_name: string;
    bank_code: string;
}

export interface CreateTransferRecipientResponse {
    success: boolean;
    recipient_code: string;
}

export interface InitiateTransferParams {
    amount: number; // in kobo/smallest unit
    recipient_code: string;
    reference: string;
    reason?: string;
    email?: string;
}

export interface InitiateTransferResponse {
    success: boolean;
    transfer_code: string;
    reference: string;
    status: 'pending' | 'success' | 'failed';
}

export interface WebhookEvent {
    event: string;
    data: {
        reference: string;
        status: string;
        amount: number;
        [key: string]: any;
    };
}

export type PaymentProviderType = 'paystack' | 'kora';
