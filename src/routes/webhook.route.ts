import { Router } from 'express';
import { WalletController } from '../controllers/wallet.controller';

const router = Router();

// Webhook routes - no auth, signature verification in controller
router.post('/paystack', WalletController.handlePaystackWebhook);
router.post('/kora', WalletController.handleKoraWebhook);
router.post('/bachs', WalletController.handleBachsWebhook);

export default router;
