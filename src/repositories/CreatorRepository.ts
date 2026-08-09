import { BaseRepository } from "./BaseRepository";
import { CreatorModel } from "../models/CreatorModel";
import { normalizeUsername } from "../utils/username";

export interface Creator {
    id: number;
    username: string;
    user_id: number;
    created_at: string;
    updated_at: string;
    avatar_url: string;
    first_name: string;
    last_name: string;
    bio: string;
    display_name?: string | null;
    store_currency?: 'NGN' | 'USD';
}

class CreatorRepositoryClass extends BaseRepository<Creator, CreatorModel> {
    constructor() {
        super(CreatorModel);
    }

    async findByUsername(username: string, withGraphFetched?: object): Promise<Creator | undefined> {
        let query = CreatorModel.query()
            .whereRaw("LOWER(username) = ?", [normalizeUsername(username)]);

        if (withGraphFetched && Object.keys(withGraphFetched).length > 0) {
            query = query.withGraphFetched(withGraphFetched);
        }

        return await query.first() as Creator | undefined;
    }

}

export const CreatorRepository = new CreatorRepositoryClass();
