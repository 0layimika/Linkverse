import { BaseRepository } from "./BaseRepository";
import { ProfileConfigModel } from "../models/ProfileConfigModel";

export interface ProfileConfig {
    id: number;
    creator_id: number;
    background_type: string;
    background_value: string | null;
    text_color: string | null;
    support_button_text: string | null;
    created_at: string;
    updated_at: string;
}

class ProfileConfigRepositoryClass extends BaseRepository<ProfileConfig, ProfileConfigModel> {
    constructor() {
        super(ProfileConfigModel);
    }

    async getByCreatorId(creatorId: number): Promise<ProfileConfig | undefined> {
        return await this.getOneWhere({ creator_id: creatorId });
    }

    async upsertForCreator(creatorId: number, data: Partial<ProfileConfig>): Promise<ProfileConfig> {
        const existing = await this.getByCreatorId(creatorId);
        if (existing) {
            return await this.update(existing.id, { ...data, creator_id: creatorId });
        }
        return await this.create({ creator_id: creatorId, ...data } as Partial<ProfileConfig>);
    }
}

export const ProfileConfigRepository = new ProfileConfigRepositoryClass();
