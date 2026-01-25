"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const wallet_controller_1 = require("../controllers/wallet.controller");
const withdrawal_controller_1 = require("../controllers/withdrawal.controller");
const validate_1 = require("../middlewares/validate");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const withdrawal_validator_1 = require("../validators/withdrawal.validator");
const router = (0, express_1.Router)();
// Protected wallet routes
router.get('/', auth_middleware_1.auth, wallet_controller_1.WalletController.getMyWallet);
router.get('/balance', auth_middleware_1.auth, wallet_controller_1.WalletController.getWalletBalance);
router.get('/transactions', auth_middleware_1.auth, (0, validate_1.validate)(withdrawal_validator_1.paginationSchema), wallet_controller_1.WalletController.getTransactionHistory);
// Bank account routes
router.get('/banks', auth_middleware_1.auth, withdrawal_controller_1.WithdrawalController.getBanks);
router.get('/resolve-account', auth_middleware_1.auth, (0, validate_1.validate)(withdrawal_validator_1.resolveAccountSchema), withdrawal_controller_1.WithdrawalController.resolveAccountNumber);
router.post('/bank-account', auth_middleware_1.auth, (0, validate_1.validate)(withdrawal_validator_1.setBankAccountSchema), withdrawal_controller_1.WithdrawalController.setBankAccount);
router.get('/bank-account', auth_middleware_1.auth, withdrawal_controller_1.WithdrawalController.getBankAccount);
// Withdrawal routes
router.post('/withdraw', auth_middleware_1.auth, (0, validate_1.validate)(withdrawal_validator_1.initiateWithdrawalSchema), withdrawal_controller_1.WithdrawalController.initiateWithdrawal);
router.get('/withdrawals', auth_middleware_1.auth, withdrawal_controller_1.WithdrawalController.getWithdrawalHistory);
exports.default = router;
//# sourceMappingURL=wallet.route.js.map