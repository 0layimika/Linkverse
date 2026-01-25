"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const profile_controller_1 = require("../controllers/profile.controller");
const validate_1 = require("../middlewares/validate");
const profile_validator_1 = require("../validators/profile.validator");
const router = (0, express_1.Router)();
// Public profile route - no auth required
router.get('/:username', (0, validate_1.validate)(profile_validator_1.getProfileSchema), profile_controller_1.ProfileController.getPublicProfile);
exports.default = router;
//# sourceMappingURL=profile.route.js.map