import { BaseRepository } from './BaseRepository';
import { UserModel, UserModelType } from '../models/UserModel';
export declare class UserRepository extends BaseRepository<UserModelType, UserModel> {
    constructor();
    findByEmail(email: string): Promise<UserModelType | undefined>;
}
//# sourceMappingURL=UserRepository.d.ts.map