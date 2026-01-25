"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const wallet_controller_1 = require("../controllers/wallet.controller");
const validate_1 = require("../middlewares/validate");
const gift_validator_1 = require("../validators/gift.validator");
const router = (0, express_1.Router)();
// Public gift routes (no auth required)
router.post('/:username', (0, validate_1.validate)(gift_validator_1.initiateGiftSchema), wallet_controller_1.WalletController.initiateGift);
router.get('/verify', (0, validate_1.validate)(gift_validator_1.verifyGiftSchema), wallet_controller_1.WalletController.verifyGiftPayment);
exports.default = router;
//# sourceMappingURL=gift.route.js.map