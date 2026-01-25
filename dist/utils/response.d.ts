import { Response } from 'express';
import { ApiResponse } from '@0layimika/api-response-kit';
export * from '@0layimika/api-response-kit';
/**
 * Fixed ExpressResponse that properly handles status code mapping
 * Fixes the issue where uppercase error codes (FORBIDDEN) don't map correctly to status codes
 * This replaces the original ExpressResponse from @0layimika/api-response-kit
 */
export declare function ExpressResponse(res: Response, response: ApiResponse<unknown>): void;
//# sourceMappingURL=response.d.ts.map