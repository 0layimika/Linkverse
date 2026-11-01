import type { Knex } from 'knex';
import knex from '../db/knex';
import type { WithdrawalPayout } from '../types/withdrawal.types';

export const WithdrawalPayoutRepository = {
    query(db: Knex | Knex.Transaction = knex) {
        return db<WithdrawalPayout>('withdrawal_payouts');
    },
    async get(quoteId: string, creatorId: number, db: Knex | Knex.Transaction = knex, lock = false) {
        const query = this.query(db).where({ id: quoteId, creator_id: creatorId });
        return (lock ? query.forUpdate() : query).first();
    },
};
