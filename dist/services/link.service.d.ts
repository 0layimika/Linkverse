import { Link } from "../repositories/LinkRepository";
export interface CreateLinkData {
    title: string;
    url: string;
    icon?: string;
}
export interface UpdateLinkData {
    title?: string;
    url?: string;
    icon?: string;
    position?: number;
}
export declare class LinkService {
    static createLink(userId: number, data: CreateLinkData): Promise<import("@0layimika/api-response-kit").ApiError | import("@0layimika/api-response-kit").ApiSuccess<Link>>;
    static getMyLinks(userId: number): Promise<import("@0layimika/api-response-kit").ApiError | import("@0layimika/api-response-kit").ApiSuccess<Link[]>>;
    static updateLink(userId: number, linkId: number, data: UpdateLinkData): Promise<import("@0layimika/api-response-kit").ApiError | import("@0layimika/api-response-kit").ApiSuccess<Link>>;
    static deleteLink(userId: number, linkId: number): Promise<import("@0layimika/api-response-kit").ApiError | import("@0layimika/api-response-kit").ApiSuccess<null>>;
    static activateLink(userId: number, linkId: number): Promise<import("@0layimika/api-response-kit").ApiError | import("@0layimika/api-response-kit").ApiSuccess<Link>>;
    static deactivateLink(userId: number, linkId: number): Promise<import("@0layimika/api-response-kit").ApiError | import("@0layimika/api-response-kit").ApiSuccess<Link>>;
    static reorderLinks(userId: number, linkIds: number[]): Promise<import("@0layimika/api-response-kit").ApiError | import("@0layimika/api-response-kit").ApiSuccess<Link[]>>;
}
//# sourceMappingURL=link.service.d.ts.map