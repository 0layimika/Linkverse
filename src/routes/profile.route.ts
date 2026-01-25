import { Router } from 'express';
import { ProfileController } from '../controllers/profile.controller';
import { validate } from '../middlewares/validate';
import { getProfileSchema } from '../validators/profile.validator';

const router = Router();

// Public profile route - no auth required
router.get('/:username', validate(getProfileSchema), ProfileController.getPublicProfile);

export default router;
