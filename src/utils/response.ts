import { Response } from 'express';
import { ApiResponse } from '@0layimika/api-response-kit';

// Re-export everything from the package
export * from '@0layimika/api-response-kit';

// Status code mapping that handles both uppercase and capitalized error codes
const statusMap: Record<string, number> = {
    'OK': 200,
    'Ok': 200,
    'CREATED': 201,
    'Created': 201,
    'NOCONTENT': 204,
    'NoContent': 204,
    'BADREQUEST': 400,
    'BadRequest': 400,
    'UNAUTHORIZED': 401,
    'Unauthorized': 401,
    'FORBIDDEN': 403,
    'Forbidden': 403,
    'NOTFOUND': 404,
    'NotFound': 404,
    'CONFLICT': 409,
    'Conflict': 409,
    'INTERNALERROR': 500,
    'InternalError': 500,
};

/**
 * Fixed ExpressResponse that properly handles status code mapping
 * Fixes the issue where uppercase error codes (FORBIDDEN) don't map correctly to status codes
 * This replaces the original ExpressResponse from @0layimika/api-response-kit
 */
export function ExpressResponse(res: Response, response: ApiResponse<unknown>): void {
    let status = 200;

    if (response.success) {
        status = 200;
    } else if (response.error?.code) {
        // Try to get status from our enhanced status map (handles both cases)
        status = statusMap[response.error.code] || 500;
    }

    res.status(status).json(response);
}

