import { CreatorRepository } from "../repositories/CreatorRepository";
import { LinkRepository } from "../repositories/LinkRepository";
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

            return Ok({
                username: creator.username,
                first_name: creator.first_name,
                last_name: creator.last_name,
                bio: creator.bio,
                avatar_url: creator.avatar_url,
                links: links.map(link => ({
                    id: link.id,
                    title: link.title,
                    url: link.url,
                    icon: link.icon,
                    position: link.position,
                })),
            }, "Profile retrieved successfully");
        } catch (err: any) {
            return InternalError(err.message);
        }
    }
}
