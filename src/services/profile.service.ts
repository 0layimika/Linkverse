import { CreatorRepository } from "../repositories/CreatorRepository";
import { LinkRepository } from "../repositories/LinkRepository";
import { ProfileConfigRepository } from "../repositories/ProfileConfigRepository";
import { CreatorSocialLinkRepository } from "../repositories/CreatorSocialLinkRepository";
import { InternalError, NotFound, Ok } from "@0layimika/api-response-kit";
import { BadRequest } from "@0layimika/api-response-kit";
import { normalizeSocialLinks, type SocialLinkInput } from "../utils/social-links";

export class ProfileService {
    static async getPublicProfile(username: string) {
        try {
            const creator = await CreatorRepository.findByUsername(username);
            if (!creator) {
                return NotFound("Creator not found");
            }

            // Get only active links for public view
            const [links, profileConfig, socialLinks] = await Promise.all([
                LinkRepository.getActiveLinksForCreator(creator.id),
                ProfileConfigRepository.getByCreatorId(creator.id),
                CreatorSocialLinkRepository.listVisibleForCreator(creator.id),
            ]);

            return Ok({
                username: creator.username,
                display_name: creator.display_name ?? null,
                first_name: creator.first_name,
                last_name: creator.last_name,
                bio: creator.bio,
                avatar_url: creator.avatar_url,
                profile_config: profileConfig ? {
                    background_type: profileConfig.background_type,
                    background_value: profileConfig.background_value,
                    text_color: profileConfig.text_color,
                    support_button_text: profileConfig.support_button_text,
                    accent_color: profileConfig.accent_color,
                    card_style: profileConfig.card_style,
                    profile_alignment: profileConfig.profile_alignment,
                    avatar_shape: profileConfig.avatar_shape,
                    avatar_size: profileConfig.avatar_size,
                    support_button_style: profileConfig.support_button_style,
                    support_enabled: profileConfig.support_enabled,
                } : null,
                social_links: socialLinks.map((socialLink) => ({
                    platform: socialLink.platform,
                    url: socialLink.url,
                    position: socialLink.position,
                })),
                links: links.map(link => ({
                    id: link.id,
                    title: link.title,
                    url: link.url,
                    icon: link.icon,
                    thumbnail_url: link.thumbnail_url,
                    display_type: link.display_type || "standard",
                    description: link.description,
                    position: link.position,
                })),
            }, "Profile retrieved successfully");
        } catch (err: any) {
            return InternalError(err.message);
        }
    }

    static async getProfileConfig(userId: number) {
        try {
            const creator = await CreatorRepository.getOneWhere({ user_id: userId });
            if (!creator) {
                return NotFound("Creator profile not found");
            }

            let config = await ProfileConfigRepository.getOneWhere({ creator_id: creator.id });
            if (!config) {
                config = await ProfileConfigRepository.create({
                    creator_id: creator.id,
                    background_type: "color",
                    background_value: null,
                    text_color: null,
                    support_button_text: "Support me",
                } as any);
            }
            const defaultConfig = {
                background_type: "color",
                background_value: null,
                text_color: null,
                support_button_text: "Support me",
                accent_color: null,
                card_style: null,
                profile_alignment: null,
                avatar_shape: null,
                avatar_size: null,
                support_button_style: null,
                support_enabled: true,
            };
            return Ok(config || defaultConfig, "Profile config retrieved successfully");
        } catch (err: any) {
            return InternalError(err.message);
        }
    }

    static async updateProfileConfig(userId: number, data: {
        background_type?: "color" | "image";
        background_value?: string | null;
        text_color?: string | null;
        support_button_text?: string | null;
        accent_color?: string | null;
        card_style?: "solid" | "outline" | "glass" | null;
        profile_alignment?: "left" | "center" | "right" | null;
        avatar_shape?: "circle" | "rounded" | null;
        avatar_size?: "small" | "medium" | "large" | null;
        support_button_style?: "solid" | "outline" | null;
        support_enabled?: boolean;
    }) {
        try {
            const creator = await CreatorRepository.getOneWhere({ user_id: userId });
            if (!creator) {
                return NotFound("Creator profile not found");
            }
            const config = await ProfileConfigRepository.upsertForCreator(creator.id, data);
            return Ok(config, "Profile config updated successfully");
        } catch (err: any) {
            return InternalError(err.message);
        }
    }

    static async getSocialLinks(userId: number) {
        try {
            const creator = await CreatorRepository.getOneWhere({ user_id: userId });
            if (!creator) {
                return NotFound("Creator profile not found");
            }

            const socialLinks = await CreatorSocialLinkRepository.listForCreator(creator.id);
            return Ok({ social_links: socialLinks }, "Social links retrieved successfully");
        } catch (err: any) {
            return InternalError(err.message);
        }
    }

    static async replaceSocialLinks(userId: number, data: { social_links: SocialLinkInput[] }) {
        try {
            const creator = await CreatorRepository.getOneWhere({ user_id: userId });
            if (!creator) {
                return NotFound("Creator profile not found");
            }

            let socialLinks;
            try {
                socialLinks = normalizeSocialLinks(data.social_links);
            } catch (err: any) {
                return BadRequest(err.message);
            }

            const updatedSocialLinks = await CreatorSocialLinkRepository.replaceForCreator(creator.id, socialLinks);
            return Ok({ social_links: updatedSocialLinks }, "Social links updated successfully");
        } catch (err: any) {
            return InternalError(err.message);
        }
    }
}
