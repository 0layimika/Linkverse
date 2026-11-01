export function parseGiftFeePercent(value: string): number {
    if (!/^\d+(\.\d{1,2})?$/.test(value.trim())) {
        throw new Error("GIFT_FEE_PERCENT must be a percentage from 0 to 100 with at most two decimal places");
    }
    const percent = Number(value);
    if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
        throw new Error("GIFT_FEE_PERCENT must be between 0 and 100");
    }
    return percent;
}

export function calculateGiftFee(amount: number, percent: number) {
    const ratePercent = parseGiftFeePercent(String(percent));
    const amountMinor = Math.round(amount * 100);
    if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0) {
        throw new Error("Gift amount must be positive and within the supported range");
    }
    const rateBasisPoints = Math.round(ratePercent * 100);
    // Round half up to the nearest cent/kobo without floating-point multiplication.
    const feeMinor = Number((BigInt(amountMinor) * BigInt(rateBasisPoints) + 5000n) / 10000n);
    return { rate_percent: ratePercent, amount_minor: feeMinor };
}
