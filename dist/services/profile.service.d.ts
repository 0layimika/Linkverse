export declare class ProfileService {
    static getPublicProfile(username: string): Promise<import("@0layimika/api-response-kit").ApiError | import("@0layimika/api-response-kit").ApiSuccess<{
        username: string;
        first_name: string;
        last_name: string;
        bio: string;
        avatar_url: string;
        links: {
            id: number;
            title: string;
            url: string;
            icon: string | null;
            position: number;
        }[];
    }>>;
}
//# sourceMappingURL=profile.service.d.ts.map