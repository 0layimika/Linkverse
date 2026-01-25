"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRepository = void 0;
// import { IParamPaginated, PaginatedData } from '@shared/types/pagination';
class BaseRepository {
    constructor(model) {
        this.model = model;
    }
    async getAll() {
        return await this.model.query();
    }
    async getAllWhere(args, withGraphFetched = {}, modifyFn) {
        return await this.model
            .query()
            .modify((qb) => {
            Object.entries(args).forEach(([key, value]) => {
                if (value === undefined || value === null)
                    return;
                if (key === 'name')
                    qb.whereILike('name', `%${value}%`);
                else if (Array.isArray(value))
                    qb.whereIn(key, value);
                else
                    qb.where(key, value);
            });
            if (modifyFn)
                modifyFn(qb);
        })
            .withGraphFetched(withGraphFetched);
    }
    async getOneWhere(args, withGraphFetched, modifyGraph) {
        let query = this.model.query().findOne(args);
        if (withGraphFetched && Object.keys(withGraphFetched).length > 0)
            query = query.withGraphFetched(withGraphFetched);
        if (modifyGraph && Object.keys(modifyGraph).length > 0)
            query = query.modifyGraph(modifyGraph);
        return await query;
    }
    async findById(id, withGraphFetched = {}, modifyGraph = {}, transaction) {
        let query = this.model.query(transaction).findById(id).withGraphFetched(withGraphFetched);
        Object.entries(modifyGraph).forEach(([relation, modifier]) => {
            query = query.modifyGraph(relation, modifier);
        });
        return await query;
    }
    async create(data, withGraphFetched = {}, transaction) {
        const created = await this.model.query(transaction).insert(data).withGraphFetched(withGraphFetched);
        const { password_hash, ...result } = created;
        return result;
    }
    async update(id, data, transaction) {
        const updated = await this.model.query(transaction).patchAndFetchById(id, data);
        const { password_hash, ...result } = updated;
        return result;
    }
    async deleteRecordById(id) {
        const isDeleted = await this.model.query().deleteById(id);
        return !!isDeleted;
    }
}
exports.BaseRepository = BaseRepository;
//# sourceMappingURL=BaseRepository.js.map