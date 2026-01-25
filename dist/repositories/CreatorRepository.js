"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreatorRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
const CreatorModel_1 = require("../models/CreatorModel");
class CreatorRepositoryClass extends BaseRepository_1.BaseRepository {
    constructor() {
        super(CreatorModel_1.CreatorModel);
    }
}
exports.CreatorRepository = new CreatorRepositoryClass();
//# sourceMappingURL=CreatorRepository.js.map