export const DISPLAY_NAME_MAX_LENGTH = 80;

/**
 * Keeps the stored value predictable while still allowing a creator to opt
 * out of a display name. `undefined` means "do not change this field".
 */
export function normalizeDisplayName(value: string | null | undefined): string | null | undefined {
    if (value === undefined || value === null) {
        return value;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}
