import { BaseRepository } from "./BaseRepository";
import { BankAccountModel } from "../models/BankAccountModel";

export interface BankAccount {
    id: number;
    creator_id: number;
    account_number: string;
    account_name: string;
    bank_code: string;
    bank_name: string;
    recipient_code: string | null;
    provider: string | null;
    created_at: string;
    updated_at: string;
}

class BankAccountRepositoryClass extends BaseRepository<BankAccount, BankAccountModel> {
    constructor() {
        super(BankAccountModel);
    }

    async getByCreatorId(creatorId: number): Promise<BankAccount | undefined> {
        return await BankAccountModel.query().findOne({ creator_id: creatorId });
    }

    async upsertForCreator(creatorId: number, data: Partial<BankAccount>): Promise<BankAccount> {
        const existing = await this.getByCreatorId(creatorId);
        if (existing) {
            return await BankAccountModel.query().patchAndFetchById(existing.id, data);
        }
        return await BankAccountModel.query().insert({
            creator_id: creatorId,
            ...data
        } as any);
    }
}

export const BankAccountRepository = new BankAccountRepositoryClass();
