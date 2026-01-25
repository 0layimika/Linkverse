import { Model, QueryBuilder, Transaction } from 'objection';
// import { IParamPaginated, PaginatedData } from '@shared/types/pagination';

export abstract class BaseRepository<T, M extends Model> {
    private model: typeof Model | any;

    constructor(model: M | any) {
        this.model = model;
    }

    async getAll(): Promise<Array<T>> {
        return await this.model.query();
    }

    async getAllWhere(
        args: object,
        withGraphFetched = {},
        modifyFn?: (qb: QueryBuilder<M>) => void,
    ): Promise<Array<T>> {
        return await this.model
            .query()
            .modify((qb:any) => {
                Object.entries(args).forEach(([key, value]) => {
                    if (value === undefined || value === null) return;

                    if (key === 'name') qb.whereILike('name', `%${value}%`);
                    else if (Array.isArray(value)) qb.whereIn(key, value);
                    else qb.where(key, value);
                });
                if (modifyFn) modifyFn(qb);
            })
            .withGraphFetched(withGraphFetched);
    }

    async getOneWhere(
        args: object,
        withGraphFetched?: object,
        modifyGraph?: object,
    ): Promise<T | undefined> {
        let query = this.model.query().findOne(args);
        if (withGraphFetched && Object.keys(withGraphFetched).length > 0)
            query = query.withGraphFetched(withGraphFetched);
        if (modifyGraph && Object.keys(modifyGraph).length > 0)
            query = query.modifyGraph(modifyGraph);
        return await query;
    }

    async findById(
        id: number | string,
        withGraphFetched = {},
        modifyGraph = {},
        transaction?: Transaction,
    ): Promise<T | undefined> {
        let query = this.model.query(transaction).findById(id).withGraphFetched(withGraphFetched);
        Object.entries(modifyGraph).forEach(([relation, modifier]) => {
            query = query.modifyGraph(relation, modifier);
        });
        return await query;
    }

    async create(data: Partial<T>, withGraphFetched={},transaction?: Transaction): Promise<T> {
        const created = await this.model.query(transaction).insert(data).withGraphFetched(withGraphFetched);
        const { password_hash, ...result } = created;
        return result as T
    }

    async update(id: string | number, data: Partial<T>, transaction?: Transaction): Promise<T> {
        const updated = await this.model.query(transaction).patchAndFetchById(id, data);
        const { password_hash, ...result } = updated;
        return result as T
    }

    async deleteRecordById(id: string | number): Promise<boolean> {
        const isDeleted = await this.model.query().deleteById(id);
        return !!isDeleted;
    }

    // Pagination helper
    // async getPaginatedData<T>(param: IParamPaginated): Promise<PaginatedData<T>> {
    //     // same pattern as your example
    // }
}
