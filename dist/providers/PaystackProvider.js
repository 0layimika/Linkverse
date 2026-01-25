"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaystackProvider = void 0;
const crypto_1 = __importDefault(require("crypto"));
const PaymentProvider_1 = require("./PaymentProvider");
class PaystackProvider extends PaymentProvider_1.PaymentProvider {
    constructor() {
        super();
        this.providerName = 'paystack';
        this.baseUrl = 'https://api.paystack.co';
        this.secretKey = process.env.PAYSTACK_SECRET_KEY || '';
    }
    async request(endpoint, options = {}) {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            ...options,
            headers: {
                Authorization: `Bearer ${this.secretKey}`,
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Paystack API error');
        }
        return data;
    }
    async initializePayment(params) {
        const response = await this.request('/transaction/initialize', {
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
    async verifyPayment(reference) {
        const response = await this.request(`/transaction/verify/${reference}`);
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
    async getBanks() {
        const response = await this.request('/bank?country=nigeria');
        return response.data.map(bank => ({
            name: bank.name,
            code: bank.code,
        }));
    }
    async resolveAccountNumber(params) {
        const response = await this.request(`/bank/resolve?account_number=${params.account_number}&bank_code=${params.bank_code}`);
        return {
            success: response.status,
            account_number: response.data.account_number,
            account_name: response.data.account_name,
            bank_code: params.bank_code,
        };
    }
    async createTransferRecipient(params) {
        const response = await this.request('/transferrecipient', {
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
    async initiateTransfer(params) {
        const response = await this.request('/transfer', {
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
    verifyWebhookSignature(payload, signature) {
        const hash = crypto_1.default
            .createHmac('sha512', this.secretKey)
            .update(payload)
            .digest('hex');
        return hash === signature;
    }
    parseWebhookEvent(body) {
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
exports.PaystackProvider = PaystackProvider;
//# sourceMappingURL=PaystackProvider.js.map