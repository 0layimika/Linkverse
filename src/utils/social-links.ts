export const SOCIAL_PLATFORMS = [
    "x",
    "instagram",
    "tiktok",
    "youtube",
    "pinterest",
    "facebook",
    "linkedin",
    "snapchat",
    "twitch",
    "spotify",
    "threads",
    "discord",
    "whatsapp",
    "telegram",
    "email",
    "website",
] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export interface SocialLinkInput {
    platform: string;
    url: string;
    is_visible?: boolean;
}

export interface NormalizedSocialLink {
    platform: SocialPlatform;
    url: string;
    is_visible: boolean;
}

const socialPlatformSet = new Set<string>(SOCIAL_PLATFORMS);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeSocialPlatform(platform: string): SocialPlatform {
    const normalized = platform.trim().toLowerCase();
    if (!socialPlatformSet.has(normalized)) {
        throw new Error("Unsupported social platform");
    }
    return normalized as SocialPlatform;
}

export function normalizeSocialUrl(platform: SocialPlatform, value: string): string {
    const trimmed = value.trim();
    if (!trimmed) {
        throw new Error("Social link URL cannot be empty");
    }

    if (platform === "email") {
        const email = trimmed.replace(/^mailto:/i, "").trim().toLowerCase();
        if (!emailPattern.test(email)) {
            throw new Error("Email social link must contain a valid email address");
        }
        return `mailto:${email}`;
    }

    // Handles are accepted for the common platforms; full URLs continue to work.
    // Keep this additive so existing stored URLs remain valid and untouched.
    if (!/^[a-z][a-z\d+.-]*:/i.test(trimmed) && !trimmed.includes(".") && !trimmed.includes("/")) {
        const handle = trimmed.replace(/^@/, "");
        const handleBases: Partial<Record<SocialPlatform, string>> = {
            x: "https://x.com/",
            instagram: "https://instagram.com/",
            tiktok: "https://tiktok.com/@",
            youtube: "https://youtube.com/@",
            pinterest: "https://pinterest.com/",
            facebook: "https://facebook.com/",
            linkedin: "https://linkedin.com/in/",
            snapchat: "https://snapchat.com/add/",
            twitch: "https://twitch.tv/",
            spotify: "https://open.spotify.com/user/",
            threads: "https://threads.net/@",
            discord: "https://discord.com/users/",
            whatsapp: "https://wa.me/",
            telegram: "https://t.me/",
        };
        const base = handleBases[platform];
        if (base) return `${base}${handle}`;
    }

    const candidate = /^[a-z][a-z\d+.-]*:/i.test(trimmed)
        ? trimmed
        : `https://${trimmed}`;

    let parsed: URL;
    try {
        parsed = new URL(candidate);
    } catch {
        throw new Error("Social link must contain a valid URL");
    }

    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
        throw new Error("Social link URL must use http or https");
    }

    return parsed.toString();
}

export function normalizeSocialLinks(links: SocialLinkInput[]): NormalizedSocialLink[] {
    const seenPlatforms = new Set<SocialPlatform>();

    return links.map((link) => {
        const platform = normalizeSocialPlatform(link.platform);
        if (seenPlatforms.has(platform)) {
            throw new Error("Each social platform can only be added once");
        }
        seenPlatforms.add(platform);

        return {
            platform,
            url: normalizeSocialUrl(platform, link.url),
            is_visible: link.is_visible ?? true,
        };
    });
}
