import { Router } from 'express';
import { LinkController } from '../controllers/link.controller';
import { validate } from '../middlewares/validate';
import { auth } from '../middlewares/auth.middleware';
import {
    createLinkSchema,
    updateLinkSchema,
    linkIdParamSchema,
    reorderLinksSchema,
} from '../validators/link.validator';

const router = Router();

// All link management routes require authentication
router.post('/', auth, validate(createLinkSchema), LinkController.createLink);
router.get('/', auth, LinkController.getMyLinks);
router.patch('/:id', auth, validate(updateLinkSchema), LinkController.updateLink);
router.delete('/:id', auth, validate(linkIdParamSchema), LinkController.deleteLink);
router.patch('/:id/activate', auth, validate(linkIdParamSchema), LinkController.activateLink);
router.patch('/:id/deactivate', auth, validate(linkIdParamSchema), LinkController.deactivateLink);
router.post('/reorder', auth, validate(reorderLinksSchema), LinkController.reorderLinks);

export default router;
