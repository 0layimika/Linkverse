"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
const UserModel_1 = require("../models/UserModel");
class UserRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(UserModel_1.UserModel);
    }
    async findByEmail(email) {
        return this.getOneWhere({ email });
    }
}
exports.UserRepository = UserRepository;
//# sourceMappingURL=UserRepository.js.map