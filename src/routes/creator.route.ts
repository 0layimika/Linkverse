import { Router } from 'express';
import { CreatorController } from '../controllers/creator.controller';
import { validate } from '../middlewares/validate';
import {auth} from "../middlewares/auth.middleware";
import {createSchema, updateSchema} from "../validators/creator.validator";


const router = Router();

router.post('/new',auth,validate(createSchema),CreatorController.createCreator)
router.patch('/update',auth,validate(updateSchema),CreatorController.updateCreator)
// router.post('/login', validate(loginSchema), AuthController.login);

export default router;
