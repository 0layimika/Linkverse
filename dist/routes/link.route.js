"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const link_controller_1 = require("../controllers/link.controller");
const validate_1 = require("../middlewares/validate");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const link_validator_1 = require("../validators/link.validator");
const router = (0, express_1.Router)();
// All link management routes require authentication
router.post('/', auth_middleware_1.auth, (0, validate_1.validate)(link_validator_1.createLinkSchema), link_controller_1.LinkController.createLink);
router.get('/', auth_middleware_1.auth, link_controller_1.LinkController.getMyLinks);
router.patch('/:id', auth_middleware_1.auth, (0, validate_1.validate)(link_validator_1.updateLinkSchema), link_controller_1.LinkController.updateLink);
router.delete('/:id', auth_middleware_1.auth, (0, validate_1.validate)(link_validator_1.linkIdParamSchema), link_controller_1.LinkController.deleteLink);
router.patch('/:id/activate', auth_middleware_1.auth, (0, validate_1.validate)(link_validator_1.linkIdParamSchema), link_controller_1.LinkController.activateLink);
router.patch('/:id/deactivate', auth_middleware_1.auth, (0, validate_1.validate)(link_validator_1.linkIdParamSchema), link_controller_1.LinkController.deactivateLink);
router.post('/reorder', auth_middleware_1.auth, (0, validate_1.validate)(link_validator_1.reorderLinksSchema), link_controller_1.LinkController.reorderLinks);
exports.default = router;
//# sourceMappingURL=link.route.js.map