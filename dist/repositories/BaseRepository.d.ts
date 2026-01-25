import { Model, QueryBuilder, Transaction } from 'objection';
export declare abstract class BaseRepository<T, M extends Model> {
    private model;
    constructor(model: M | any);
    getAll(): Promise<Array<T>>;
    getAllWhere(args: object, withGraphFetched?: {}, modifyFn?: (qb: QueryBuilder<M>) => void): Promise<Array<T>>;
    getOneWhere(args: object, withGraphFetched?: object, modifyGraph?: object): Promise<T | undefined>;
    findById(id: number | string, withGraphFetched?: {}, modifyGraph?: {}, transaction?: Transaction): Promise<T | undefined>;
    create(data: Partial<T>, withGraphFetched?: {}, transaction?: Transaction): Promise<T>;
    update(id: string | number, data: Partial<T>, transaction?: Transaction): Promise<T>;
    deleteRecordById(id: string | number): Promise<boolean>;
}
//# sourceMappingURL=BaseRepository.d.ts.map