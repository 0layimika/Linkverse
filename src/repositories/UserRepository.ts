import { BaseRepository } from './BaseRepository';
import { UserModel, UserModelType } from '../models/UserModel';

export class UserRepository extends BaseRepository<UserModelType, UserModel> {
    constructor() {
        super(UserModel);
    }

    async findByEmail(email: string): Promise<UserModelType | undefined> {
        const normalizedEmail = email.trim().toLowerCase();
        return await UserModel.query().whereRaw('LOWER(email) = ?', [normalizedEmail]).first();
    }
}
