import { BaseRepository } from "./BaseRepository";
import { LinkModel } from "../models/LinkModel";

export interface Link {
    id: number;
    creator_id: number;
    title: string;
    url: string;
    icon: string | null;
    thumbnail_url: string | null;
    display_type: "standard" | "featured";
    description: string | null;
    position: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

class LinkRepositoryClass extends BaseRepository<Link, LinkModel> {
    constructor() {
        super(LinkModel);
    }

    async getActiveLinksForCreator(creatorId: number): Promise<Link[]> {
        return await LinkModel.query()
            .where({ creator_id: creatorId, is_active: true })
            .orderBy('position', 'asc');
    }

    async getAllLinksForCreator(creatorId: number): Promise<Link[]> {
        return await LinkModel.query()
            .where({ creator_id: creatorId })
            .orderBy('position', 'asc');
    }

    async getMaxPosition(creatorId: number): Promise<number> {
        const result = await LinkModel.query()
            .where({ creator_id: creatorId })
            .max('position as maxPosition')
            .first();
        return (result as any)?.maxPosition || 0;
    }
}

export const LinkRepository = new LinkRepositoryClass();
