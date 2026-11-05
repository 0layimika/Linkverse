import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { auth } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/admin.middleware';
import { AdminError, AdminService } from '../services/admin.service';
import { blockBody, debitBody, listQuery, releaseBody, releaseParams, userParams, walletParams } from '../validators/admin.validator';

const router = Router();
router.use(auth, requireAdmin);
function handle(work: (req: Request) => Promise<unknown>) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try { res.json({ success: true, data: await work(req) }); }
        catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ') } });
            } else if (error instanceof AdminError) {
                res.status(error.status).json({ success: false, error: { code: 'ADMIN_ERROR', message: error.message } });
            } else { next(error); }
        }
    };
}
router.get('/session', handle(async (req) => ({ user_id: req.user.id })));
router.get('/overview', handle(() => AdminService.overview()));
router.get('/users', handle((req) => AdminService.users(listQuery.parse(req.query))));
router.get('/transactions', handle((req) => AdminService.transactions(listQuery.parse(req.query))));
router.get('/pending-releases', handle((req) => AdminService.releases(listQuery.parse(req.query))));
router.get('/audit', handle((req) => AdminService.audit(listQuery.parse(req.query))));
router.patch('/users/:userId/block', handle((req) => AdminService.block(req.user.id, userParams.parse(req.params).userId, blockBody.parse(req.body))));
router.post('/wallets/:walletId/debit', handle((req) => AdminService.debit(req.user.id, walletParams.parse(req.params).walletId, debitBody.parse(req.body))));
router.post('/pending-releases/:releaseId/release', handle((req) => AdminService.release(req.user.id, releaseParams.parse(req.params).releaseId, releaseBody.parse(req.body))));
export default router;
