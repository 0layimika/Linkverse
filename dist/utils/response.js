"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpressResponse = ExpressResponse;
// Re-export everything from the package
__exportStar(require("@0layimika/api-response-kit"), exports);
// Status code mapping that handles both uppercase and capitalized error codes
const statusMap = {
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
function ExpressResponse(res, response) {
    let status = 200;
    if (response.success) {
        status = 200;
    }
    else if (response.error?.code) {
        // Try to get status from our enhanced status map (handles both cases)
        status = statusMap[response.error.code] || 500;
    }
    res.status(status).json(response);
}
//# sourceMappingURL=response.js.map