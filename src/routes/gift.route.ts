import { Router } from 'express';
import { WalletController } from '../controllers/wallet.controller';
import { validate } from '../middlewares/validate';
import { initiateGiftSchema, verifyGiftSchema } from '../validators/gift.validator';

const router = Router();

// Public gift routes (no auth required)
router.post('/:username', validate(initiateGiftSchema), WalletController.initiateGift);
router.get('/verify', validate(verifyGiftSchema), WalletController.verifyGiftPayment);

export default router;
