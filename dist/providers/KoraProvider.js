"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KoraProvider = void 0;
const crypto_1 = __importDefault(require("crypto"));
const PaymentProvider_1 = require("./PaymentProvider");
class KoraProvider extends PaymentProvider_1.PaymentProvider {
    constructor() {
        super();
        this.providerName = 'kora';
        this.baseUrl = 'https://api.korapay.com/merchant/api/v1';
        this.secretKey = process.env.KORA_SECRET_KEY || '';
        this.publicKey = process.env.KORA_PUBLIC_KEY || '';
    }
    async request(endpoint, options = {}, usePublicKey = false) {
        const authKey = usePublicKey ? this.publicKey : this.secretKey;
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            ...options,
            headers: {
                Authorization: `Bearer ${authKey}`,
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });
        const data = await response.json();
        if (!response.ok) {
            const errorMessage = data?.message || `HTTP ${response.status}: ${response.statusText}`;
            throw new Error(errorMessage);
        }
        if (data.status === false) {
            throw new Error(data?.message || 'Kora API error');
        }
        return data;
    }
    async initializePayment(params) {
        const response = await this.request('/charges/initialize', {
            method: 'POST',
            body: JSON.stringify({
                amount: params.amount / 100, // Kora expects amount in naira, not kobo
                currency: 'NGN',
                reference: params.reference,
                customer: {
                    email: params.email,
                },
                redirect_url: params.callback_url,
                metadata: params.metadata,
                merchant_bears_cost: false
            }),
        });
        return {
            success: response.status,
            authorization_url: response.data.checkout_url,
            reference: response.data.reference,
        };
    }
    async verifyPayment(reference) {
        const response = await this.request(`/charges/${reference}`);
        return {
            success: response.status,
            status: response.data.status === 'success' ? 'success' :
                response.data.status === 'failed' ? 'failed' : 'pending',
            amount: response.data.amount * 100, // Convert back to kobo
            reference: response.data.reference,
            provider_reference: response.data.payment_reference,
            metadata: response.data.metadata,
        };
    }
    async getBanks() {
        const response = await this.request('/misc/banks?countryCode=NG', {
            method: 'GET',
        }, true);
        if (!response.data || !Array.isArray(response.data)) {
            throw new Error('Invalid banks response format');
        }
        return response.data.map(bank => ({
            name: bank.name,
            code: bank.code,
        }));
    }
    async resolveAccountNumber(params) {
        const response = await this.request('/misc/banks/resolve', {
            method: 'POST',
            body: JSON.stringify({
                bank: params.bank_code,
                account: params.account_number,
            }),
        });
        return {
            success: response.status,
            account_number: response.data.account_number,
            account_name: response.data.account_name,
            bank_code: params.bank_code,
        };
    }
    async createTransferRecipient(params) {
        // Kora doesn't require creating a transfer recipient beforehand
        // We'll create a virtual recipient code from the account details
        const recipientCode = Buffer.from(JSON.stringify({
            account_number: params.account_number,
            account_name: params.account_name,
            bank_code: params.bank_code,
        })).toString('base64');
        return {
            success: true,
            recipient_code: recipientCode,
        };
    }
    async initiateTransfer(params) {
        // Decode the recipient details from our virtual recipient code
        const recipientDetails = JSON.parse(Buffer.from(params.recipient_code, 'base64').toString());
        console.log("recipientDetails", recipientDetails);
        console.log("params", params);
        // Use whitelisted IP for disburse endpoint
        const disburseUrl = 'http://24.199.121.184/merchant/api/v1/transactions/disburse';
        const authKey = this.secretKey;
        const response = await fetch(disburseUrl, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${authKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                reference: params.reference,
                destination: {
                    type: 'bank_account',
                    amount: params.amount / 100, // Kora expects naira
                    currency: 'NGN',
                    bank_account: {
                        bank: recipientDetails.bank_code,
                        account: recipientDetails.account_number,
                    },
                    narration: params.reason || 'Withdrawal',
                    customer: {
                        name: recipientDetails.account_name,
                        email: params.email || '',
                    },
                },
            }),
        });
        const data = await response.json();
        if (!response.ok) {
            console.log("data", data);
            const errorMessage = data?.message || `HTTP ${response.status}: ${response.statusText}`;
            throw new Error(errorMessage);
        }
        if (data.status === false || !data.status) {
            console.log("data", data);
            throw new Error(data?.message || 'Kora API error');
        }
        return {
            success: data.status === true,
            transfer_code: data.data.reference,
            reference: params.reference,
            status: data.data.status === 'success' ? 'success' :
                data.data.status === 'failed' ? 'failed' : 'pending',
        };
    }
    verifyWebhookSignature(payload, signature) {
        const hash = crypto_1.default
            .createHmac('sha256', this.secretKey)
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
                amount: (body.data.amount || 0) * 100, // Convert to kobo
                ...body.data,
            },
        };
    }
}
exports.KoraProvider = KoraProvider;
//# sourceMappingURL=KoraProvider.js.map