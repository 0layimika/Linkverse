export type PaymentMethodType = 'card' | 'bank_transfer' | 'mobile_money' | 'crypto' | 'unknown';

export interface PaymentMethodEvidence {
    type: PaymentMethodType;
    provider_method: string | null;
    source: 'webhook' | 'payment_lookup' | 'checkout_lookup' | 'unknown';
}

export const UNKNOWN_PAYMENT_METHOD: PaymentMethodEvidence = { type: 'unknown', provider_method: null, source: 'unknown' };

function classify(value: unknown): PaymentMethodType {
    if (typeof value !== 'string') return 'unknown';
    const method = value.trim().toUpperCase();
    if (['CARD', 'USD_CARD', 'NGN_CARD'].includes(method)) return 'card';
    if (['BANK_TRANSFER', 'NGN_BANK_TRANSFER'].includes(method)) return 'bank_transfer';
    if (method === 'MOBILE_MONEY' || /^MOMO_(GHS|KES|TZS|UGX|XAF|XOF|RWF|MWK|ZMW)$/.test(method)) return 'mobile_money';
    if (method === 'CRYPTO') return 'crypto';
    return 'unknown';
}

/** Read provider-owned fields only; customer-supplied metadata is never evidence. */
export function paymentMethodFromData(data: any, source: PaymentMethodEvidence['source'] = 'webhook'): PaymentMethodEvidence {
    const candidates = [data?.payment_method, data?.payment_method_details?.type, data?.charge?.payment_method];
    const known = candidates.map((value) => ({ value, type: classify(value) })).filter((item) => item.type !== 'unknown');
    // Conflicting hints do not allow a card-funded credit to bypass its hold.
    const selected = known.find((item) => item.type === 'card') || known[0];
    return selected
        ? { type: selected.type, provider_method: String(selected.value).trim().toUpperCase(), source }
        : { ...UNKNOWN_PAYMENT_METHOD };
}

export function isConfirmedNonCard(method: PaymentMethodEvidence | undefined): boolean {
    return !!method && ['bank_transfer', 'mobile_money', 'crypto'].includes(method.type);
}

export function earningsBalanceType(currency: string, method?: PaymentMethodEvidence): 'pending' | 'available' {
    return currency === 'USD' && !isConfirmedNonCard(method) ? 'pending' : 'available';
}
