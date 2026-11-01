/** Parse NGN/USD money without silently rounding fractional cents or kobo. */
export function moneyToMinor(value: string | number): number {
    const text = String(value);
    if (!/^\d+(\.\d{1,2})?$/.test(text)) throw new Error('Amount must have at most two decimal places');
    const [whole, fraction = ''] = text.split('.');
    const minor = BigInt(whole!) * 100n + BigInt(fraction.padEnd(2, '0'));
    if (minor > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('Amount exceeds the supported range');
    return Number(minor);
}

export function minorToMoney(value: number): string {
    if (!Number.isSafeInteger(value) || value < 0) throw new Error('Invalid money amount');
    return `${Math.floor(value / 100)}.${String(value % 100).padStart(2, '0')}`;
}

/** Percentage in basis points (100 = 1%), rounded half up to cents/kobo. */
export function percentageFeeMinor(amountMinor: number, basisPoints: number): number {
    if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0 || !Number.isInteger(basisPoints) || basisPoints < 0 || basisPoints > 10000) {
        throw new Error('Invalid percentage fee input');
    }
    return Number((BigInt(amountMinor) * BigInt(basisPoints) + 5000n) / 10000n);
}
