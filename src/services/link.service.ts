import { LinkRepository, Link } from "../repositories/LinkRepository";
import { CreatorRepository } from "../repositories/CreatorRepository";
import { BadRequest, InternalError, NotFound, Ok } from "@0layimika/api-response-kit";

export interface CreateLinkData {
    title: string;
    url: string;
    icon?: string;
    thumbnail_url?: string | null;
}

export interface UpdateLinkData {
    title?: string;
    url?: string;
    icon?: string;
    thumbnail_url?: string | null;
    position?: number;
}

export class LinkService {
    static async createLink(userId: number, data: CreateLinkData) {
        try {
            const creator = await CreatorRepository.getOneWhere({ user_id: userId });
            if (!creator) {
                return NotFound("Creator profile not found");
            }

            const maxPosition = await LinkRepository.getMaxPosition(creator.id);

            const link = await LinkRepository.create({
                creator_id: creator.id,
                title: data.title,
                url: data.url,
                icon: data.icon || null,
                thumbnail_url: data.thumbnail_url ?? null,
                position: maxPosition + 1,
                is_active: true,
            } as Partial<Link>);

            return Ok(link, "Link created successfully");
        } catch (err: any) {
            return InternalError(err.message);
        }
    }

    static async getMyLinks(userId: number) {
        try {
            const creator = await CreatorRepository.getOneWhere({ user_id: userId });
            if (!creator) {
                return NotFound("Creator profile not found");
            }

            const links = await LinkRepository.getAllLinksForCreator(creator.id);
            return Ok(links, "Links retrieved successfully");
        } catch (err: any) {
            return InternalError(err.message);
        }
    }

    static async updateLink(userId: number, linkId: number, data: UpdateLinkData) {
        try {
            const creator = await CreatorRepository.getOneWhere({ user_id: userId });
            if (!creator) {
                return NotFound("Creator profile not found");
            }

            const link = await LinkRepository.findById(linkId);
            if (!link) {
                return NotFound("Link not found");
            }

            if (link.creator_id !== creator.id) {
                return BadRequest("You do not own this link");
            }

            const updated = await LinkRepository.update(linkId, data);
            return Ok(updated, "Link updated successfully");
        } catch (err: any) {
            return InternalError(err.message);
        }
    }

    static async deleteLink(userId: number, linkId: number) {
        try {
            const creator = await CreatorRepository.getOneWhere({ user_id: userId });
            if (!creator) {
                return NotFound("Creator profile not found");
            }

            const link = await LinkRepository.findById(linkId);
            if (!link) {
                return NotFound("Link not found");
            }

            if (link.creator_id !== creator.id) {
                return BadRequest("You do not own this link");
            }

            await LinkRepository.deleteRecordById(linkId);
            return Ok(null, "Link deleted successfully");
        } catch (err: any) {
            return InternalError(err.message);
        }
    }

    static async activateLink(userId: number, linkId: number) {
        try {
            const creator = await CreatorRepository.getOneWhere({ user_id: userId });
            if (!creator) {
                return NotFound("Creator profile not found");
            }

            const link = await LinkRepository.findById(linkId);
            if (!link) {
                return NotFound("Link not found");
            }

            if (link.creator_id !== creator.id) {
                return BadRequest("You do not own this link");
            }

            const updated = await LinkRepository.update(linkId, { is_active: true });
            return Ok(updated, "Link activated successfully");
        } catch (err: any) {
            return InternalError(err.message);
        }
    }

    static async deactivateLink(userId: number, linkId: number) {
        try {
            const creator = await CreatorRepository.getOneWhere({ user_id: userId });
            if (!creator) {
                return NotFound("Creator profile not found");
            }

            const link = await LinkRepository.findById(linkId);
            if (!link) {
                return NotFound("Link not found");
            }

            if (link.creator_id !== creator.id) {
                return BadRequest("You do not own this link");
            }

            const updated = await LinkRepository.update(linkId, { is_active: false });
            return Ok(updated, "Link deactivated successfully");
        } catch (err: any) {
            return InternalError(err.message);
        }
    }

    static async reorderLinks(userId: number, linkIds: number[]) {
        try {
            const creator = await CreatorRepository.getOneWhere({ user_id: userId });
            if (!creator) {
                return NotFound("Creator profile not found");
            }

            // Verify all links belong to the creator
            const links = await LinkRepository.getAllLinksForCreator(creator.id);
            const creatorLinkIds = links.map(l => l.id);

            for (const id of linkIds) {
                if (!creatorLinkIds.includes(id)) {
                    return BadRequest("One or more links do not belong to you");
                }
            }

            // Update positions
            for (let i = 0; i < linkIds.length; i++) {
                await LinkRepository.update(linkIds[i], { position: i + 1 });
            }

            const updatedLinks = await LinkRepository.getAllLinksForCreator(creator.id);
            return Ok(updatedLinks, "Links reordered successfully");
        } catch (err: any) {
            return InternalError(err.message);
        }
    }
}
