"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const creator_controller_1 = require("../controllers/creator.controller");
const validate_1 = require("../middlewares/validate");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const creator_validator_1 = require("../validators/creator.validator");
const router = (0, express_1.Router)();
router.post('/new', auth_middleware_1.auth, (0, validate_1.validate)(creator_validator_1.createSchema), creator_controller_1.CreatorController.createCreator);
router.patch('/update', auth_middleware_1.auth, (0, validate_1.validate)(creator_validator_1.updateSchema), creator_controller_1.CreatorController.updateCreator);
// router.post('/login', validate(loginSchema), AuthController.login);
exports.default = router;
//# sourceMappingURL=creator.route.js.map