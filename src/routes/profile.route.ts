import { Router } from 'express';
import { ProfileController } from '../controllers/profile.controller';
import { validate } from '../middlewares/validate';
import { auth } from '../middlewares/auth.middleware';
import {
    getProfileSchema,
    getProfileConfigSchema,
    updateProfileConfigSchema,
    getProfileQRSchema,
} from '../validators/profile.validator';

const router = Router();

// Profile config routes - auth required (must be before :username)
router.get('/config', auth, validate(getProfileConfigSchema), ProfileController.getProfileConfig);
router.patch('/config', auth, validate(updateProfileConfigSchema), ProfileController.updateProfileConfig);

// Public QR code - no auth required
router.get('/:username/qr', validate(getProfileQRSchema), ProfileController.getQRCode);

// Public profile route - no auth required
router.get('/:username', validate(getProfileSchema), ProfileController.getPublicProfile);

export default router;
