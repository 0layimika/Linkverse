import { BaseRepository } from "./BaseRepository";
import { CreatorModel } from "../models/CreatorModel";
import { normalizeUsername } from "../utils/username";
import { UserModel } from '../models/UserModel';

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

    // Keep findByUsername unfiltered so blocked accounts still reserve their usernames.
    async findPublicByUsername(username: string): Promise<Creator | undefined> {
        return await CreatorModel.query()
            .whereRaw('LOWER(username) = ?', [normalizeUsername(username)])
            .whereExists(UserModel.query().select(1)
                .whereColumn('users.id', 'creators.user_id')
                .where('users.is_blocked', false))
            .first() as Creator | undefined;
    }

}

export const CreatorRepository = new CreatorRepositoryClass();
