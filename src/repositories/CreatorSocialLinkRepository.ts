import { transaction } from "objection";
import { CreatorSocialLinkModel } from "../models/CreatorSocialLinkModel";
import type { NormalizedSocialLink, SocialPlatform } from "../utils/social-links";

export interface CreatorSocialLink {
    id: number;
    creator_id: number;
    platform: SocialPlatform;
    url: string;
    position: number;
    is_visible: boolean;
    created_at: string;
    updated_at: string;
}

class CreatorSocialLinkRepositoryClass {
    async listForCreator(creatorId: number): Promise<CreatorSocialLink[]> {
        return await CreatorSocialLinkModel.query()
            .where("creator_id", creatorId)
            .orderBy("position", "asc")
            .orderBy("id", "asc");
    }

    async listVisibleForCreator(creatorId: number): Promise<CreatorSocialLink[]> {
        return await CreatorSocialLinkModel.query()
            .where({ creator_id: creatorId, is_visible: true })
            .orderBy("position", "asc")
            .orderBy("id", "asc");
    }

    async replaceForCreator(
        creatorId: number,
        links: NormalizedSocialLink[],
    ): Promise<CreatorSocialLink[]> {
        return await transaction(CreatorSocialLinkModel.knex(), async (trx) => {
            await CreatorSocialLinkModel.query(trx)
                .delete()
                .where("creator_id", creatorId);

            if (links.length === 0) {
                return [];
            }

            return await CreatorSocialLinkModel.query(trx)
                .insert(links.map((link, position) => ({
                    creator_id: creatorId,
                    platform: link.platform,
                    url: link.url,
                    position,
                    is_visible: link.is_visible,
                })))
                .returning("*");
        });
    }
}

export const CreatorSocialLinkRepository = new CreatorSocialLinkRepositoryClass();
