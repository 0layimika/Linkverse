/**
 * Usernames are stored in one canonical form. Route input may use any case,
 * but storage and generated public URLs always use lowercase, trimmed values.
 */
export function normalizeUsername(username: string): string {
    return username.trim().toLowerCase();
}
