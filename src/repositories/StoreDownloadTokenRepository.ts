import { BaseRepository } from "./BaseRepository";
import { StoreDownloadTokenModel } from "../models/StoreDownloadTokenModel";
import { Transaction } from "objection";

export interface StoreDownloadTokenRecord {
    id: number;
    order_id: number;
    token: string;
    max_downloads: number;
    download_count: number;
    last_download_at: string | null;
    revoked_at: string | null;
    created_at: string;
    updated_at: string;
}

class StoreDownloadTokenRepositoryClass extends BaseRepository<StoreDownloadTokenRecord, StoreDownloadTokenModel> {
    constructor() {
        super(StoreDownloadTokenModel);
    }

    async getByToken(token: string): Promise<StoreDownloadTokenRecord | undefined> {
        return await StoreDownloadTokenModel.query().findOne({ token });
    }

    async incrementDownload(id: number, trx?: Transaction): Promise<StoreDownloadTokenRecord> {
        return await StoreDownloadTokenModel.query(trx).patchAndFetchById(id, {
            download_count: StoreDownloadTokenModel.raw("download_count + 1"),
            last_download_at: new Date().toISOString(),
        });
    }
}

export const StoreDownloadTokenRepository = new StoreDownloadTokenRepositoryClass();
