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
declare class BankAccountRepositoryClass extends BaseRepository<BankAccount, BankAccountModel> {
    constructor();
    getByCreatorId(creatorId: number): Promise<BankAccount | undefined>;
    upsertForCreator(creatorId: number, data: Partial<BankAccount>): Promise<BankAccount>;
}
export declare const BankAccountRepository: BankAccountRepositoryClass;
export {};
//# sourceMappingURL=BankAccountRepository.d.ts.map