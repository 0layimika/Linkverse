"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const validate_1 = require("../middlewares/validate");
const auth_validator_1 = require("../validators/auth.validator");
const router = (0, express_1.Router)();
router.post('/register', (0, validate_1.validate)(auth_validator_1.registerSchema), auth_controller_1.AuthController.register);
router.patch('/verify', (0, validate_1.validate)(auth_validator_1.verifySchema), auth_controller_1.AuthController.verify);
router.post('/resend-verification', (0, validate_1.validate)(auth_validator_1.resendVerificationSchema), auth_controller_1.AuthController.resendVerificationLink);
router.post('/forgot-password', (0, validate_1.validate)(auth_validator_1.ForgotPassword), auth_controller_1.AuthController.forgotPassword);
router.post('/resend-forgot-password', (0, validate_1.validate)(auth_validator_1.resendForgotPasswordSchema), auth_controller_1.AuthController.resendForgotPasswordLink);
router.put('/reset-password', (0, validate_1.validate)(auth_validator_1.ResetPassword), auth_controller_1.AuthController.resetPassword);
router.post('/login', (0, validate_1.validate)(auth_validator_1.loginSchema), auth_controller_1.AuthController.login);
exports.default = router;
//# sourceMappingURL=auth.route.js.map