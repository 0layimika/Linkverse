interface UploadResult {
    url: string;
    publicId: string;
    fileName: string;
    fileType: string;
    size: number;
}
export declare const uploadFileService: (fileBuffer: Buffer, originalName: string, mimetype: string, folder?: string) => Promise<{
    success: boolean;
    data?: UploadResult;
    error?: string;
}>;
export declare const deleteFileService: (publicIdOrUrl: string) => Promise<{
    success: boolean;
    error?: string;
}>;
export {};
//# sourceMappingURL=media.service.d.ts.map