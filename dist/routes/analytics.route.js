"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analytics_controller_1 = require("../controllers/analytics.controller");
const validate_1 = require("../middlewares/validate");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const analytics_validator_1 = require("../validators/analytics.validator");
const router = (0, express_1.Router)();
// Public tracking endpoints (no auth required)
router.post("/track/profile/:username", (0, validate_1.validate)(analytics_validator_1.trackProfileViewSchema), analytics_controller_1.AnalyticsController.trackProfileView);
router.post("/track/link/:linkId", (0, validate_1.validate)(analytics_validator_1.trackLinkClickSchema), analytics_controller_1.AnalyticsController.trackLinkClick);
// Protected analytics endpoints (auth required)
router.get("/overview", auth_middleware_1.auth, (0, validate_1.validate)(analytics_validator_1.getOverviewSchema), analytics_controller_1.AnalyticsController.getOverview);
router.get("/links/:linkId", auth_middleware_1.auth, (0, validate_1.validate)(analytics_validator_1.getLinkAnalyticsSchema), analytics_controller_1.AnalyticsController.getLinkAnalytics);
exports.default = router;
//# sourceMappingURL=analytics.route.js.map