const DAY_MS = 24 * 60 * 60 * 1000;
const LAGOS_OFFSET_MS = 60 * 60 * 1000;

/** Count whole weekday hours in Africa/Lagos (UTC+1), skipping Saturday/Sunday. */
export function addLagosBusinessDays(start: Date, businessDays: number): Date {
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(businessDays) || businessDays <= 0) {
        throw new Error('Invalid business-day settlement delay');
    }
    let cursor = start.getTime() + LAGOS_OFFSET_MS;
    let remaining = Math.round(businessDays * DAY_MS);
    while (remaining > 0) {
        const local = new Date(cursor);
        const midnight = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate());
        const day = local.getUTCDay();
        if (day === 0 || day === 6) {
            cursor = midnight + (day === 6 ? 2 : 1) * DAY_MS;
            continue;
        }
        const untilMidnight = midnight + DAY_MS - cursor;
        const elapsed = Math.min(remaining, untilMidnight);
        cursor += elapsed;
        remaining -= elapsed;
    }
    // Funds must not become available on a weekend when the delay ends at midnight.
    const end = new Date(cursor);
    if (end.getUTCDay() === 6) cursor += 2 * DAY_MS;
    else if (end.getUTCDay() === 0) cursor += DAY_MS;
    return new Date(cursor - LAGOS_OFFSET_MS);
}
