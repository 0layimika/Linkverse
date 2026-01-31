import { CreatorRepository } from "../repositories/CreatorRepository";
import { LinkRepository } from "../repositories/LinkRepository";
import { ProfileConfigRepository } from "../repositories/ProfileConfigRepository";
import { InternalError, NotFound, Ok } from "@0layimika/api-response-kit";

export class ProfileService {
    static async getPublicProfile(username: string) {
        try {
            const creator = await CreatorRepository.getOneWhere({ username });
            if (!creator) {
                return NotFound("Creator not found");
            }

            // Get only active links for public view
            const links = await LinkRepository.getActiveLinksForCreator(creator.id);
            const profileConfig = await ProfileConfigRepository.getByCreatorId(creator.id);

            return Ok({
                username: creator.username,
                first_name: creator.first_name,
                last_name: creator.last_name,
                bio: creator.bio,
                avatar_url: creator.avatar_url,
                profile_config: profileConfig ? {
                    background_type: profileConfig.background_type,
                    background_value: profileConfig.background_value,
                    text_color: profileConfig.text_color,
                    support_button_text: profileConfig.support_button_text,
                } : null,
                links: links.map(link => ({
                    id: link.id,
                    title: link.title,
                    url: link.url,
                    icon: link.icon,
                    thumbnail_url: link.thumbnail_url,
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
}
