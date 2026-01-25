"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const wallet_controller_1 = require("../controllers/wallet.controller");
const router = (0, express_1.Router)();
// Webhook routes - no auth, signature verification in controller
router.post('/paystack', wallet_controller_1.WalletController.handlePaystackWebhook);
router.post('/kora', wallet_controller_1.WalletController.handleKoraWebhook);
exports.default = router;
//# sourceMappingURL=webhook.route.js.map