import { Router } from "express";
import { StoreController } from "../controllers/store.controller";
import { validate } from "../middlewares/validate";
import { auth } from "../middlewares/auth.middleware";
import {
    createProductSchema,
    updateProductSchema,
    deleteProductSchema,
    paginationSchema,
    getStorefrontSchema,
    initiatePurchaseSchema,
    cartCheckoutSchema,
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
    storeCurrencySchema,
} from "../validators/store.validator";

const router = Router();

// Public routes (specific first)
router.get("/verify", validate(verifyPurchaseSchema), StoreController.verifyPurchase);
router.get("/order", validate(getOrderSchema), StoreController.getOrder);
router.get("/download/:token", validate(downloadSchema), StoreController.download);

// Auth routes
router.post("/products", auth, validate(createProductSchema), StoreController.createProduct);
router.get("/products", auth, validate(paginationSchema), StoreController.listMyProducts);
router.patch("/products/:id", auth, validate(updateProductSchema), StoreController.updateProduct);
router.get("/settings/currency", auth, StoreController.getStoreCurrency);
router.patch("/settings/currency", auth, validate(storeCurrencySchema), StoreController.setStoreCurrency);
router.delete("/products/:id", auth, validate(deleteProductSchema), StoreController.deleteProduct);

router.get("/orders", auth, validate(paginationSchema), StoreController.listOrders);
router.patch("/orders/:id/status", auth, validate(updateOrderStatusSchema), StoreController.updateOrderStatus);
router.post("/orders/:id/resend-email", auth, validate(resendOrderEmailSchema), StoreController.resendOrderEmails);
router.get("/bookings", auth, validate(paginationSchema), StoreController.listBookings);
router.patch("/bookings/:id/status", auth, validate(updateBookingStatusSchema), StoreController.updateBookingStatus);

router.get("/availability", auth, StoreController.listAvailability);
router.post("/availability", auth, validate(createAvailabilitySchema), StoreController.createAvailability);
router.patch("/availability/:id", auth, validate(updateAvailabilitySchema), StoreController.updateAvailability);
router.delete("/availability/:id", auth, validate(deleteAvailabilitySchema), StoreController.deleteAvailability);
router.get("/services/:serviceId/slots", auth, validate(ownerListSlotsSchema), StoreController.listOwnerServiceSlots);
router.post("/services/block", auth, validate(blockSlotSchema), StoreController.blockServiceSlot);

// Public store routes
router.get("/:username/services/:serviceId/slots", validate(listSlotsSchema), StoreController.listServiceSlots);
router.post("/:username/services/:serviceId/hold", validate(holdSlotSchema), StoreController.holdServiceSlot);
router.post("/:username/buy/:productId", validate(initiatePurchaseSchema), StoreController.initiatePurchase);
router.post("/:username/cart/checkout", validate(cartCheckoutSchema), StoreController.checkoutCart);
router.get("/:username", validate(getStorefrontSchema), StoreController.getStorefront);

export default router;
