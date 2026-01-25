import { BaseRepository } from "./BaseRepository";
import { CreatorModel } from "../models/CreatorModel";

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
}

class CreatorRepositoryClass extends BaseRepository<Creator, CreatorModel> {
    constructor() {
        super(CreatorModel);
    }

}

export const CreatorRepository = new CreatorRepositoryClass();
