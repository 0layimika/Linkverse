import { BaseRepository } from './BaseRepository';
import { UserModel, UserModelType } from '../models/UserModel';

export class UserRepository extends BaseRepository<UserModelType, UserModel> {
    constructor() {
        super(UserModel);
    }

    async findByEmail(email: string): Promise<UserModelType | undefined> {
        return this.getOneWhere({ email });
    }
}
