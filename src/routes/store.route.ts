import { Router } from "express";
import { StoreController } from "../controllers/store.controller";
import { validate } from "../middlewares/validate";
import { auth } from "../middlewares/auth.middleware";
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
    listSlotsSchema,
    holdSlotSchema,
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

router.get("/orders", auth, validate(paginationSchema), StoreController.listOrders);
router.post("/orders/:id/resend-email", auth, validate(resendOrderEmailSchema), StoreController.resendOrderEmails);
router.get("/bookings", auth, validate(paginationSchema), StoreController.listBookings);

router.get("/availability", auth, StoreController.listAvailability);
router.post("/availability", auth, validate(createAvailabilitySchema), StoreController.createAvailability);

// Public store routes
router.get("/:username/services/:serviceId/slots", validate(listSlotsSchema), StoreController.listServiceSlots);
router.post("/:username/services/:serviceId/hold", validate(holdSlotSchema), StoreController.holdServiceSlot);
router.post("/:username/buy/:productId", validate(initiatePurchaseSchema), StoreController.initiatePurchase);
router.get("/:username", validate(getStorefrontSchema), StoreController.getStorefront);

export default router;
