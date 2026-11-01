import crypto from "crypto";
import { PaymentProvider } from "./PaymentProvider";
import { BACHS_API_KEY, BACHS_BASE_URL, BACHS_WEBHOOK_SECRET, BACHS_RETURN_URL, BACHS_CANCEL_URL, BACHS_GIFT_RETURN_URL, BACHS_GIFT_CANCEL_URL } from "../config/env";
import type { InitializePaymentParams, InitializePaymentResponse, VerifyPaymentResponse, Bank, ResolveAccountParams, ResolveAccountResponse, CreateTransferRecipientParams, CreateTransferRecipientResponse, InitiateTransferParams, InitiateTransferResponse, WebhookEvent, TransferQuote } from "../types/payment.types";
import { minorToMoney, moneyToMinor } from '../utils/money';
import { paymentMethodFromData, UNKNOWN_PAYMENT_METHOD, type PaymentMethodEvidence } from '../utils/payment-method';

export class BachsRequestError extends Error {
    constructor(message: string, readonly statusCode: number, readonly errorCode: string, readonly outcomeUnknown: boolean) {
        super(message);
    }
}

/** Bachs hosted checkout adapter. Settlement and webhook fulfillment are provider-owned. */
export class BachsProvider extends PaymentProvider {
    readonly providerName = "bachs";

    private async request<T>(path: string, init: RequestInit = {}, logBody = true): Promise<T> {
        const requestBody = typeof init.body === "string" ? (() => { try { return JSON.parse(init.body as string); } catch { return init.body; } })() : init.body;
        console.log("[Bachs][request]", { url: `${BACHS_BASE_URL}${path}`, method: init.method || "GET", payload: requestBody });
        const response = await fetch(`${BACHS_BASE_URL}${path}`, {
            ...init,
            signal: init.signal || AbortSignal.timeout(15_000),
            headers: { Authorization: `Bearer ${BACHS_API_KEY}`, "Content-Type": "application/json", ...(init.headers || {}) },
        });
        const body = await response.json().catch(() => {
            throw new BachsRequestError('Bachs returned an unreadable response', response.status, 'INVALID_RESPONSE', true);
        });
        console.log("[Bachs][response]", { url: `${BACHS_BASE_URL}${path}`, status: response.status, ok: response.ok, ...(logBody ? { body } : {}) });
        if (!response.ok) {
            // Bachs business-rule failures use detail/error_code; validation
            // failures can also include errors, and limit failures use details.
            const error = body as any;
            const message = error?.detail || error?.message || error?.error;
            const detail = [
                typeof message === "string" ? message : message ? JSON.stringify(message) : undefined,
                error?.errors ? JSON.stringify(error.errors) : undefined,
                error?.details ? JSON.stringify(error.details) : undefined,
            ].filter(Boolean).join("; ") || `HTTP ${response.status}`;
            const code = error?.error_code ? ` [${error.error_code}]` : "";
            const outcomeUnknown = response.status >= 500 || response.status === 409 || /reference already exists/i.test(detail);
            throw new BachsRequestError(`Bachs request failed (${response.status})${code}: ${detail}`, response.status, String(error?.error_code || ''), outcomeUnknown);
        }
        return body as T;
    }

    async initializePayment(params: InitializePaymentParams): Promise<InitializePaymentResponse> {
        const amount = (Number(params.amount) / 100).toFixed(2);
        const isGift = params.metadata?.type === 'gift';
        const configuredReturn = isGift ? BACHS_GIFT_RETURN_URL : BACHS_RETURN_URL;
        const configuredCancel = isGift ? BACHS_GIFT_CANCEL_URL : BACHS_CANCEL_URL;
        const publicReturnUrl = configuredReturn ? (() => { try { const target = new URL(configuredReturn); if (params.callback_url) new URL(params.callback_url).searchParams.forEach((value, key) => target.searchParams.set(key, value)); return target.toString(); } catch { return configuredReturn; } })() : params.callback_url || "";
        const publicCancelUrl = configuredCancel ? (() => { try { const target = new URL(configuredCancel); new URL(publicReturnUrl).searchParams.forEach((value, key) => target.searchParams.set(key, value)); return target.toString(); } catch { return configuredCancel; } })() : publicReturnUrl;
        const response = await this.request<any>("/v1/checkout-sessions", {
            method: "POST",
            body: JSON.stringify({
                pricing: { price_type: "fixed", amount, currency: String(params.currency || "NGN").toUpperCase() },
                billing_currency: String(params.currency || "NGN").toUpperCase(),
                customer: {
                    email: params.email,
                    first_name: params.metadata?.customer_first_name || "CreatorLink",
                    last_name: params.metadata?.customer_last_name || "Customer",
                },
                reference: params.reference,
                return_url: publicReturnUrl,
                cancel_url: publicCancelUrl,
                metadata: { ...(params.metadata || {}), creatorlink_reference: params.reference },
                expires_in_minutes: 15,
            }),
        });
        const data = response.data || response;
        return {
            success: Boolean(response.success ?? response.status ?? data.checkout_url),
            authorization_url: data.checkout_url,
            reference: data.checkout_id || data.reference || params.reference,
        };
    }

    async verifyPayment(reference: string): Promise<VerifyPaymentResponse> {
        // Bachs explicitly treats the webhook as the fulfillment source of truth.
        return { success: true, status: "pending", amount: 0, reference };
    }

    async resolvePaymentMethod(data: any, reference?: string): Promise<PaymentMethodEvidence> {
        const direct = paymentMethodFromData(data);
        if (direct.type !== 'unknown') return direct;

        const succeeded = (status: unknown) => ['succeeded', 'success', 'accepted', 'overpaid'].includes(String(status || '').toLowerCase());
        const lookup = async (path: string) => {
            try {
                const response = await this.request<any>(path, { signal: AbortSignal.timeout(5000) }, false);
                const result = response?.data?.data || response?.data || response;
                if (reference && result?.reference && result.reference !== reference) return null;
                return result;
            } catch {
                // The payment stays on the normal 2.5-business-day hold if a
                // read fails or the provider still has no method information.
                return null;
            }
        };
        const paymentId = data?.payment_id || data?.charge_id || data?.charge?.payment_id;
        if (typeof paymentId === 'string' && /^(pay|ch)_[A-Za-z0-9_-]+$/.test(paymentId)) {
            const payment = await lookup(`/v1/payments/${encodeURIComponent(paymentId)}`);
            if (payment && succeeded(payment.status)) {
                const method = paymentMethodFromData(payment, 'payment_lookup');
                if (method.type !== 'unknown') return method;
            }
        }
        const checkoutId = data?.checkout_id || (typeof data?.id === 'string' && data.id.startsWith('chk_') ? data.id : undefined);
        if (typeof checkoutId === 'string' && /^chk_[A-Za-z0-9_-]+$/.test(checkoutId)) {
            const checkout = await lookup(`/v1/checkout-sessions/${encodeURIComponent(checkoutId)}`);
            if (checkout && (succeeded(checkout.payment_status) || succeeded(checkout.charge?.status))) {
                const method = paymentMethodFromData(checkout, 'checkout_lookup');
                if (method.type !== 'unknown') return method;
            }
        }
        return { ...UNKNOWN_PAYMENT_METHOD };
    }

    async getBanks(): Promise<Bank[]> {
        const response = await this.request<any>("/v1/payouts/banks?country_code=NG");
        const payload = response?.data ?? response;
        const banks = Array.isArray(payload) ? payload : (payload?.data || payload?.banks || []);
        return banks.map((bank: any) => ({ name: bank.name || bank.bank_name || bank.display_name || "", code: bank.code || bank.bank_code || bank.nibss_bank_code || "" }))
            .filter((bank: Bank) => Boolean(bank.name && bank.code));
    }

    async resolveAccountNumber(params: ResolveAccountParams): Promise<ResolveAccountResponse> {
        const response = await this.request<any>("/v1/payouts/resolve-account", {
            method: "POST",
            body: JSON.stringify({ bank_code: params.bank_code, account_number: params.account_number }),
        });
        const data = response?.data?.data || response?.data || response;
        return { success: Boolean(response?.success ?? response?.status ?? data?.success ?? data?.status ?? data?.account_name), account_number: data.account_number || params.account_number, account_name: data.account_name, bank_code: data.bank_code || params.bank_code };
    }

    async createTransferRecipient(params: CreateTransferRecipientParams): Promise<CreateTransferRecipientResponse> {
        const response = await this.request<any>("/v1/payouts/destinations", {
            method: "POST",
            body: JSON.stringify({
                destination_type: "bank_account",
                currency: String(params.currency || "NGN").toUpperCase(),
                label: `${params.bank_name || params.bank_code} - ${params.account_number}`,
                account_number: params.account_number,
                account_name: params.account_name,
                bank_code: params.bank_code,
                bank_name: params.bank_name || params.bank_code,
            }),
        });
        const destination = response?.data?.data || response?.data || response;
        if (!destination?.id) throw new Error("Bachs payout destination was not created");
        return { success: true, recipient_code: String(destination.id) };
    }

    async quoteTransfer(amount: string, currency: string, reference: string): Promise<TransferQuote> {
        const response = await this.request<any>('/v1/payouts/quotes', {
            method: 'POST',
            headers: { Accept: 'application/json', 'Idempotency-Key': `${reference}:quote` },
            body: JSON.stringify({ from_currency: currency, to_currency: 'NGN', amount, payout_method: 'BANK_TRANSFER' }),
        });
        const quote = response?.data?.data || response?.data || response;
        if (!quote?.quote_id || quote.from_currency !== currency || quote.to_currency !== 'NGN'
            || moneyToMinor(quote.from_amount) !== moneyToMinor(amount) || moneyToMinor(quote.to_amount) <= 0
            || !/^\d+(\.\d+)?$/.test(String(quote.exchange_rate)) || Number(quote.exchange_rate) <= 0
            || !Number.isFinite(Date.parse(quote.expires_at))) {
            throw new Error('Bachs returned an invalid withdrawal quote');
        }
        // This quote supplies FX values; CreatorLink prices the withdrawal fee separately.
        return {
            quote_id: quote.quote_id, from_currency: quote.from_currency, to_currency: quote.to_currency,
            from_amount: minorToMoney(moneyToMinor(quote.from_amount)),
            to_amount: minorToMoney(moneyToMinor(quote.to_amount)),
            exchange_rate: String(quote.exchange_rate), expires_at: quote.expires_at,
            raw: quote,
        };
    }

    async validateTransferRecipient(recipientCode: string): Promise<void> {
        const response = await this.request<any>(`/v1/payouts/destinations/${encodeURIComponent(recipientCode)}`);
        const destination = response?.data?.data || response?.data || response;
        if (destination?.is_usable !== true || destination.currency !== 'NGN') {
            throw new Error('The NGN bank destination is not ready for payouts');
        }
    }

    private transferResponse(payout: any, reference: string): InitiateTransferResponse {
        if (!payout?.id || !['pending', 'processing', 'completed', 'paid', 'success', 'failed'].includes(String(payout.status).toLowerCase())) {
            throw new BachsRequestError('Bachs returned an invalid payout response', 200, 'INVALID_RESPONSE', true);
        }
        if (payout.reference && payout.reference !== reference) throw new Error('Bachs payout reference mismatch');
        const status = String(payout.status).toLowerCase();
        return {
            success: true, transfer_code: String(payout.id), reference,
            status: ['completed', 'paid', 'success'].includes(status) ? 'success' : status === 'failed' ? 'failed' : 'pending',
            provider_response: payout,
        };
    }

    async findTransfer(reference: string): Promise<InitiateTransferResponse | null> {
        const response = await this.request<any>(`/v1/payouts?reference=${encodeURIComponent(reference)}`);
        const payload = response?.data?.data || response?.data || response;
        const items = Array.isArray(payload) ? payload : payload?.items;
        if (!Array.isArray(items)) throw new Error('Bachs returned an invalid payout lookup');
        const matches = items.filter((payout: any) => payout.reference === reference);
        if (matches.length > 1) throw new Error('Multiple Bachs payouts match this withdrawal');
        if (items.length && !matches.length) throw new Error('Bachs payout lookup did not match the reference');
        return matches[0] ? this.transferResponse(matches[0], reference) : null;
    }

    async initiateTransfer(params: InitiateTransferParams): Promise<InitiateTransferResponse> {
        const sourceCurrency = String(params.currency || 'NGN').toUpperCase();
        if (sourceCurrency !== 'NGN' && !params.quote_id) throw new Error('A reviewed payout quote is required for USD withdrawals');

        const response = await this.request<any>("/v1/payouts", {
            method: "POST",
            headers: { Accept: "application/json", "Idempotency-Key": params.reference },
            body: JSON.stringify({
                destination: params.recipient_code,
                ...(params.quote_id ? { quote_id: params.quote_id } : { amount: minorToMoney(params.amount) }),
                reference: params.reference,
            }),
        });
        const payout = response?.data?.data || response?.data || response;
        return this.transferResponse(payout, params.reference);
    }

    verifyWebhookSignature(payload: string, signature: string, timestamp?: string): boolean {
        if (!BACHS_WEBHOOK_SECRET || !timestamp || !signature) return false;
        const timestampNumber = Number(timestamp);
        if (!Number.isFinite(timestampNumber) || Math.abs(Date.now() / 1000 - timestampNumber) > 300) return false;
        const expected = crypto.createHmac("sha256", BACHS_WEBHOOK_SECRET).update(`${timestamp}.${payload}`, "utf8").digest("hex");
        return expected.length === signature.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    }

    parseWebhookEvent(body: any): WebhookEvent {
        const data = body?.data || {};
        const normalizedAmount = data.settlement_amount ?? data.amount;
        const normalizedCurrency = data.settlement_currency || data.currency;
        return { event: body?.type || body?.event || "unknown", data: { ...data, amount: normalizedAmount, currency: normalizedCurrency, reference: data.metadata?.creatorlink_reference || body?.metadata?.creatorlink_reference || data.reference || data.payout_reference || data.checkout_id || "", status: data.status || body?.status || "" } };
    }
}
