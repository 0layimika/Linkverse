import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validate } from '../middlewares/validate';
import {
    ForgotPassword,
    registerSchema,
    ResetPassword,
    verifySchema,
    loginSchema,
    resendVerificationSchema,
    resendForgotPasswordSchema
} from '../validators/auth.validator';

const router = Router();

router.post('/register', validate(registerSchema), AuthController.register);
router.patch('/verify', validate(verifySchema), AuthController.verify);
router.post('/resend-verification', validate(resendVerificationSchema), AuthController.resendVerificationLink);
router.post('/forgot-password', validate(ForgotPassword), AuthController.forgotPassword);
router.post('/resend-forgot-password', validate(resendForgotPasswordSchema), AuthController.resendForgotPasswordLink);
router.put('/reset-password', validate(ResetPassword), AuthController.resetPassword);
router.post('/login', validate(loginSchema), AuthController.login);

export default router;
