import { Response } from "express";
import { ExpressResponse, InternalError } from "../utils/response";
import { StoreService } from "../services/store.service";
import {
    createProductSchema,
    updateProductSchema,
    paginationSchema,
    getStorefrontSchema,
    initiatePurchaseSchema,
    verifyPurchaseSchema,
    getOrderSchema,
    resendOrderEmailSchema,
    downloadSchema,
    createAvailabilitySchema,
    updateAvailabilitySchema,
    deleteAvailabilitySchema,
    listSlotsSchema,
    holdSlotSchema,
    ownerListSlotsSchema,
    blockSlotSchema,
    updateOrderStatusSchema,
    updateBookingStatusSchema,
} from "../validators/store.validator";

export class StoreController {
    private static parsePagination(query: { limit?: string; offset?: string } | undefined) {
        const rawLimit = query?.limit ? parseInt(query.limit) : 20;
        const rawOffset = query?.offset ? parseInt(query.offset) : 0;
        const limit = Number.isNaN(rawLimit) ? 20 : Math.min(Math.max(rawLimit, 1), 100);
        const offset = Number.isNaN(rawOffset) ? 0 : Math.max(rawOffset, 0);
        return { limit, offset };
    }

    static async createProduct(req: any, res: Response): Promise<any> {
        try {
            const { body } = req as createProductSchema;
            const result = await StoreService.createProduct(req.user.id, body);
            return ExpressResponse(res, result);
        } catch (err: any) {
            return ExpressResponse(res, InternalError(err.message));
        }
    }

    static async updateProduct(req: any, res: Response): Promise<any> {
        try {
            const { params, body } = req as updateProductSchema;
            const result = await StoreService.updateProduct(req.user.id, Number(params.id), body);
            return ExpressResponse(res, result);
        } catch (err: any) {
            return ExpressResponse(res, InternalError(err.message));
        }
    }

    static async listMyProducts(req: any, res: Response): Promise<any> {
        try {
            const { query } = req as paginationSchema;
            const { limit, offset } = StoreController.parsePagination(query);
            const result = await StoreService.listMyProducts(req.user.id, limit, offset);
            return ExpressResponse(res, result);
        } catch (err: any) {
            return ExpressResponse(res, InternalError(err.message));
        }
    }

    static async listOrders(req: any, res: Response): Promise<any> {
        try {
            const { query } = req as paginationSchema;
            const { limit, offset } = StoreController.parsePagination(query);
            const result = await StoreService.listOrders(req.user.id, limit, offset);
            return ExpressResponse(res, result);
        } catch (err: any) {
            return ExpressResponse(res, InternalError(err.message));
        }
    }

    static async listBookings(req: any, res: Response): Promise<any> {
        try {
            const { query } = req as paginationSchema;
            const { limit, offset } = StoreController.parsePagination(query);
            const result = await StoreService.listBookings(req.user.id, limit, offset);
            return ExpressResponse(res, result);
        } catch (err: any) {
            return ExpressResponse(res, InternalError(err.message));
        }
    }

    static async createAvailability(req: any, res: Response): Promise<any> {
        try {
            const { body } = req as createAvailabilitySchema;
            const result = await StoreService.createAvailabilityWindow(req.user.id, body);
            return ExpressResponse(res, result);
        } catch (err: any) {
            return ExpressResponse(res, InternalError(err.message));
        }
    }

    static async listAvailability(req: any, res: Response): Promise<any> {
        try {
            const result = await StoreService.listAvailabilityWindows(req.user.id);
            return ExpressResponse(res, result);
        } catch (err: any) {
            return ExpressResponse(res, InternalError(err.message));
        }
    }

    static async updateAvailability(req: any, res: Response): Promise<any> {
        try {
            const { params, body } = req as updateAvailabilitySchema;
            const result = await StoreService.updateAvailabilityWindow(req.user.id, Number(params.id), body);
            return ExpressResponse(res, result);
        } catch (err: any) {
            return ExpressResponse(res, InternalError(err.message));
        }
    }

    static async deleteAvailability(req: any, res: Response): Promise<any> {
        try {
            const { params } = req as deleteAvailabilitySchema;
            const result = await StoreService.deleteAvailabilityWindow(req.user.id, Number(params.id));
            return ExpressResponse(res, result);
        } catch (err: any) {
            return ExpressResponse(res, InternalError(err.message));
        }
    }

    static async getStorefront(req: any, res: Response): Promise<any> {
        try {
            const { params, query } = req as getStorefrontSchema;
            const { limit, offset } = StoreController.parsePagination(query as any);
            const result = await StoreService.getStorefront(params.username, limit, offset);
            return ExpressResponse(res, result);
        } catch (err: any) {
            return ExpressResponse(res, InternalError(err.message));
        }
    }

    static async initiatePurchase(req: any, res: Response): Promise<any> {
        try {
            const { params, body } = req as initiatePurchaseSchema;
            const result = await StoreService.initiatePurchase(params.username, Number(params.productId), body);
            return ExpressResponse(res, result);
        } catch (err: any) {
            return ExpressResponse(res, InternalError(err.message));
        }
    }

    static async verifyPurchase(req: any, res: Response): Promise<any> {
        try {
            const { query } = req as verifyPurchaseSchema;
            const result = await StoreService.verifyPurchase(query.reference);
            return ExpressResponse(res, result);
        } catch (err: any) {
            return ExpressResponse(res, InternalError(err.message));
        }
    }

    static async getOrder(req: any, res: Response): Promise<any> {
        try {
            const { query } = req as getOrderSchema;
            const result = await StoreService.getOrderByReference(query.reference);
            return ExpressResponse(res, result);
        } catch (err: any) {
            return ExpressResponse(res, InternalError(err.message));
        }
    }

    static async resendOrderEmails(req: any, res: Response): Promise<any> {
        try {
            const { params } = req as resendOrderEmailSchema;
            const result = await StoreService.resendOrderEmails(req.user.id, Number(params.id));
            return ExpressResponse(res, result);
        } catch (err: any) {
            return ExpressResponse(res, InternalError(err.message));
        }
    }

    static async updateOrderStatus(req: any, res: Response): Promise<any> {
        try {
            const { params, body } = req as updateOrderStatusSchema;
            const result = await StoreService.updateOrderStatus(req.user.id, Number(params.id), body.status);
            return ExpressResponse(res, result);
        } catch (err: any) {
            return ExpressResponse(res, InternalError(err.message));
        }
    }

    static async updateBookingStatus(req: any, res: Response): Promise<any> {
        try {
            const { params, body } = req as updateBookingStatusSchema;
            const result = await StoreService.updateBookingStatus(req.user.id, Number(params.id), body.status);
            return ExpressResponse(res, result);
        } catch (err: any) {
            return ExpressResponse(res, InternalError(err.message));
        }
    }

    static async download(req: any, res: Response): Promise<any> {
        try {
            const { params } = req as downloadSchema;
            const result = await StoreService.getDownload(params.token);
            return ExpressResponse(res, result);
        } catch (err: any) {
            return ExpressResponse(res, InternalError(err.message));
        }
    }

    static async listServiceSlots(req: any, res: Response): Promise<any> {
        try {
            const { params, query } = req as listSlotsSchema;
            const result = await StoreService.getServiceSlots(params.username, Number(params.serviceId), query.from, query.to);
            return ExpressResponse(res, result);
        } catch (err: any) {
            return ExpressResponse(res, InternalError(err.message));
        }
    }

    static async holdServiceSlot(req: any, res: Response): Promise<any> {
        try {
            const { params, body } = req as holdSlotSchema;
            const result = await StoreService.holdServiceSlot(params.username, Number(params.serviceId), body);
            return ExpressResponse(res, result);
        } catch (err: any) {
            return ExpressResponse(res, InternalError(err.message));
        }
    }

    static async listOwnerServiceSlots(req: any, res: Response): Promise<any> {
        try {
            const { params, query } = req as ownerListSlotsSchema;
            const result = await StoreService.listMyServiceSlots(req.user.id, Number(params.serviceId), query.from, query.to);
            return ExpressResponse(res, result);
        } catch (err: any) {
            return ExpressResponse(res, InternalError(err.message));
        }
    }

    static async blockServiceSlot(req: any, res: Response): Promise<any> {
        try {
            const { body } = req as blockSlotSchema;
            const result = await StoreService.blockServiceSlot(req.user.id, body);
            return ExpressResponse(res, result);
        } catch (err: any) {
            return ExpressResponse(res, InternalError(err.message));
        }
    }
}
