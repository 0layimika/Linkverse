import { BaseRepository } from "./BaseRepository";
import { LinkModel } from "../models/LinkModel";
export interface Link {
    id: number;
    creator_id: number;
    title: string;
    url: string;
    icon: string | null;
    position: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}
declare class LinkRepositoryClass extends BaseRepository<Link, LinkModel> {
    constructor();
    getActiveLinksForCreator(creatorId: number): Promise<Link[]>;
    getAllLinksForCreator(creatorId: number): Promise<Link[]>;
    getMaxPosition(creatorId: number): Promise<number>;
}
export declare const LinkRepository: LinkRepositoryClass;
export {};
//# sourceMappingURL=LinkRepository.d.ts.map