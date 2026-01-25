import { Router } from "express";
import { AnalyticsController } from "../controllers/analytics.controller";
import { validate } from "../middlewares/validate";
import { auth } from "../middlewares/auth.middleware";
import {
    trackProfileViewSchema,
    trackLinkClickSchema,
    getOverviewSchema,
    getLinkAnalyticsSchema,
} from "../validators/analytics.validator";

const router = Router();

// Public tracking endpoints (no auth required)
router.post(
    "/track/profile/:username",
    validate(trackProfileViewSchema),
    AnalyticsController.trackProfileView
);
router.post(
    "/track/link/:linkId",
    validate(trackLinkClickSchema),
    AnalyticsController.trackLinkClick
);

// Protected analytics endpoints (auth required)
router.get(
    "/overview",
    auth,
    validate(getOverviewSchema),
    AnalyticsController.getOverview
);
router.get(
    "/links/:linkId",
    auth,
    validate(getLinkAnalyticsSchema),
    AnalyticsController.getLinkAnalytics
);

export default router;
