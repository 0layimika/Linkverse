import { Router } from 'express';
import { WalletController } from '../controllers/wallet.controller';
import { WithdrawalController } from '../controllers/withdrawal.controller';
import { validate } from '../middlewares/validate';
import { auth } from '../middlewares/auth.middleware';
import {
    setBankAccountSchema,
    initiateWithdrawalSchema,
    resolveAccountSchema,
    paginationSchema,
} from '../validators/withdrawal.validator';

const router = Router();

// Protected wallet routes
router.get('/', auth, WalletController.getMyWallet);
router.get('/balance', auth, WalletController.getWalletBalance);
router.get('/transactions', auth, validate(paginationSchema), WalletController.getTransactionHistory);

// Bank account routes
router.get('/banks', auth, WithdrawalController.getBanks);
router.get('/resolve-account', auth, validate(resolveAccountSchema), WithdrawalController.resolveAccountNumber);
router.post('/bank-account', auth, validate(setBankAccountSchema), WithdrawalController.setBankAccount);
router.get('/bank-account', auth, WithdrawalController.getBankAccount);

// Withdrawal routes
router.post('/withdraw', auth, validate(initiateWithdrawalSchema), WithdrawalController.initiateWithdrawal);
router.get('/withdrawals', auth, WithdrawalController.getWithdrawalHistory);

export default router;
