import crypto from "crypto";
import { PaymentProvider } from "./PaymentProvider";
import { BACHS_API_KEY, BACHS_BASE_URL, BACHS_WEBHOOK_SECRET, BACHS_RETURN_URL, BACHS_CANCEL_URL, BACHS_GIFT_RETURN_URL, BACHS_GIFT_CANCEL_URL } from "../config/env";
import type { InitializePaymentParams, InitializePaymentResponse, VerifyPaymentResponse, Bank, ResolveAccountParams, ResolveAccountResponse, CreateTransferRecipientParams, CreateTransferRecipientResponse, InitiateTransferParams, InitiateTransferResponse, WebhookEvent } from "../types/payment.types";

/** Bachs hosted checkout adapter. Settlement and webhook fulfillment are provider-owned. */
export class BachsProvider extends PaymentProvider {
    readonly providerName = "bachs";

    private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
        const requestBody = typeof init.body === "string" ? (() => { try { return JSON.parse(init.body as string); } catch { return init.body; } })() : init.body;
        console.log("[Bachs][request]", { url: `${BACHS_BASE_URL}${path}`, method: init.method || "GET", payload: requestBody });
        const response = await fetch(`${BACHS_BASE_URL}${path}`, {
            ...init,
            headers: { Authorization: `Bearer ${BACHS_API_KEY}`, "Content-Type": "application/json", ...(init.headers || {}) },
        });
        const body = await response.json().catch(() => ({}));
        console.log("[Bachs][response]", { url: `${BACHS_BASE_URL}${path}`, status: response.status, ok: response.ok, body });
        if (!response.ok) {
            const detail = (body as any)?.message || (body as any)?.error || (body as any)?.errors ? JSON.stringify((body as any)?.errors || (body as any)?.error || (body as any)?.message) : `HTTP ${response.status}`;
            throw new Error(`Bachs request failed (${response.status}): ${detail}`);
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

    async initiateTransfer(params: InitiateTransferParams): Promise<InitiateTransferResponse> {
        const sourceCurrency = String(params.currency || "NGN").toUpperCase();
        const amount = (Number(params.amount) / 100).toFixed(2);
        let quoteId: string | undefined;

        if (sourceCurrency !== "NGN") {
            const quoteResponse = await this.request<any>("/v1/payouts/quotes", {
                method: "POST",
                headers: { Accept: "application/json", "Idempotency-Key": `${params.reference}:quote` },
                body: JSON.stringify({
                    from_currency: sourceCurrency,
                    to_currency: "NGN",
                    amount,
                }),
            });
            const quote = quoteResponse?.data?.data || quoteResponse?.data || quoteResponse;
            quoteId = quote?.id || quote?.quote_id;
            if (!quoteId) throw new Error("Bachs FX quote was not created");
        }

        const response = await this.request<any>("/v1/payouts", {
            method: "POST",
            headers: { Accept: "application/json", "Idempotency-Key": params.reference },
            body: JSON.stringify({
                destination: params.recipient_code,
                ...(quoteId ? { quote_id: quoteId } : { amount }),
                reference: params.reference,
            }),
        });
        const payout = response?.data?.data || response?.data || response;
        const status = String(payout.status || "pending").toLowerCase();
        return { success: true, transfer_code: String(payout.reference || payout.id || params.reference), reference: params.reference, status: status === "completed" || status === "paid" || status === "success" ? "success" : status === "failed" ? "failed" : "pending" };
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
