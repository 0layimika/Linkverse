"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GiftService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const WalletRepository_1 = require("../repositories/WalletRepository");
const TransactionRepository_1 = require("../repositories/TransactionRepository");
const CreatorRepository_1 = require("../repositories/CreatorRepository");
const wallet_service_1 = require("./wallet.service");
const PaymentProviderFactory_1 = require("../providers/PaymentProviderFactory");
const api_response_kit_1 = require("@0layimika/api-response-kit");
const env_1 = require("../config/env");
const mail_service_1 = require("./mail.service");
class GiftService {
    static generateReference() {
        return `gift_${Date.now()}_${crypto_1.default.randomBytes(8).toString('hex')}`;
    }
    static async initiateGift(creatorUsername, data) {
        try {
            const creator = await CreatorRepository_1.CreatorRepository.getOneWhere({ username: creatorUsername });
            if (!creator) {
                return (0, api_response_kit_1.NotFound)("Creator not found");
            }
            if (data.amount < 100) {
                return (0, api_response_kit_1.BadRequest)("Minimum gift amount is 100 Naira");
            }
            const wallet = await wallet_service_1.WalletService.getOrCreateWallet(creator.id);
            const provider = (0, PaymentProviderFactory_1.getPaymentProvider)();
            const reference = this.generateReference();
            const amountInKobo = data.amount * 100;
            // Create pending transaction
            const transaction = await TransactionRepository_1.TransactionRepository.create({
                wallet_id: wallet.id,
                type: 'gift',
                amount: data.amount,
                currency: 'NGN',
                status: 'pending',
                reference,
                provider: provider.providerName,
                description: data.description || null,
                sender_name: data.sender_name || null,
                sender_email: data.sender_email,
                metadata: {
                    creator_username: creatorUsername,
                    creator_id: creator.id,
                },
            });
            // Build callback URL with reference
            const callbackUrl = process.env.PAYMENT_CALLBACK_URL ||
                `${env_1.FRONTEND_URL}/payment/callback?reference=${reference}`;
            // Initialize payment
            const paymentResult = await provider.initializePayment({
                amount: amountInKobo,
                email: data.sender_email,
                reference,
                metadata: {
                    transaction_id: transaction.id,
                    creator_id: creator.id,
                    type: 'gift',
                },
                callback_url: callbackUrl,
            });
            if (!paymentResult.success) {
                await TransactionRepository_1.TransactionRepository.updateStatus(transaction.id, 'failed');
                return (0, api_response_kit_1.BadRequest)("Failed to initialize payment");
            }
            return (0, api_response_kit_1.Ok)({
                authorization_url: paymentResult.authorization_url,
                reference: paymentResult.reference,
                transaction_id: transaction.id,
            }, "Payment initialized successfully");
        }
        catch (err) {
            return (0, api_response_kit_1.InternalError)(err.message);
        }
    }
    static async verifyGiftPayment(reference) {
        try {
            const transaction = await TransactionRepository_1.TransactionRepository.getByReference(reference);
            if (!transaction) {
                return (0, api_response_kit_1.NotFound)("Transaction not found");
            }
            if (transaction.status === 'completed') {
                return (0, api_response_kit_1.Ok)({ status: 'completed' }, "Gift already processed");
            }
            const provider = (0, PaymentProviderFactory_1.getPaymentProvider)();
            const verifyResult = await provider.verifyPayment(reference);
            if (verifyResult.status === 'success') {
                // Credit wallet
                await wallet_service_1.WalletService.creditWallet(transaction.wallet_id, transaction.amount, transaction.id);
                // Update transaction with provider reference
                await TransactionRepository_1.TransactionRepository.updateStatus(transaction.id, 'completed', verifyResult.provider_reference);
                // Send tip notification email to creator
                await this.sendTipNotification(transaction);
                return (0, api_response_kit_1.Ok)({ status: 'completed' }, "Gift received successfully");
            }
            else if (verifyResult.status === 'failed') {
                await TransactionRepository_1.TransactionRepository.updateStatus(transaction.id, 'failed');
                return (0, api_response_kit_1.BadRequest)("Payment failed");
            }
            return (0, api_response_kit_1.Ok)({ status: 'pending' }, "Payment is still pending");
        }
        catch (err) {
            return (0, api_response_kit_1.InternalError)(err.message);
        }
    }
    static async sendTipNotification(transaction) {
        try {
            const metadata = transaction.metadata;
            if (!metadata?.creator_id)
                return;
            const creator = await CreatorRepository_1.CreatorRepository.getOneWhere({ id: metadata.creator_id }, { user: true });
            if (!creator?.user?.email)
                return;
            const creatorName = creator.first_name || creator.username;
            const senderName = transaction.sender_name || "Anonymous";
            await mail_service_1.MailService.sendTipNotificationEmail(creator.user.email, creatorName, transaction.amount, senderName, transaction.description);
        }
        catch (error) {
            console.error("Failed to send tip notification email:", error);
        }
    }
    static async handleWebhook(_provider, payload, signature, body) {
        try {
            const paymentProvider = (0, PaymentProviderFactory_1.getPaymentProvider)();
            // Verify webhook signature
            if (!paymentProvider.verifyWebhookSignature(payload, signature)) {
                return (0, api_response_kit_1.BadRequest)("Invalid webhook signature");
            }
            const event = paymentProvider.parseWebhookEvent(body);
            // Handle charge success event
            if (event.event === 'charge.success' || event.event === 'charge.completed') {
                const transaction = await TransactionRepository_1.TransactionRepository.getByReference(event.data.reference);
                if (!transaction) {
                    return (0, api_response_kit_1.NotFound)("Transaction not found");
                }
                if (transaction.status === 'completed') {
                    return (0, api_response_kit_1.Ok)(null, "Transaction already processed");
                }
                if (transaction.type === 'gift') {
                    await wallet_service_1.WalletService.creditWallet(transaction.wallet_id, transaction.amount, transaction.id);
                    // Update transaction status
                    await TransactionRepository_1.TransactionRepository.updateStatus(transaction.id, 'completed', event.data.reference);
                    // Send tip notification email to creator
                    await this.sendTipNotification(transaction);
                }
                return (0, api_response_kit_1.Ok)(null, "Webhook processed successfully");
            }
            // Handle failed charge
            if (event.event === 'charge.failed') {
                const transaction = await TransactionRepository_1.TransactionRepository.getByReference(event.data.reference);
                if (transaction && transaction.status === 'pending') {
                    await TransactionRepository_1.TransactionRepository.updateStatus(transaction.id, 'failed');
                }
                return (0, api_response_kit_1.Ok)(null, "Failed charge webhook processed");
            }
            // Handle transfer events for withdrawals
            if (event.event === 'transfer.success' || event.event === 'payout.completed') {
                const transaction = await TransactionRepository_1.TransactionRepository.getByReference(event.data.reference);
                if (transaction && transaction.type === 'withdrawal' && transaction.status === 'pending') {
                    await TransactionRepository_1.TransactionRepository.updateStatus(transaction.id, 'completed', event.data.reference);
                }
                return (0, api_response_kit_1.Ok)(null, "Transfer success webhook processed");
            }
            if (event.event === 'transfer.failed' || event.event === 'payout.failed') {
                const transaction = await TransactionRepository_1.TransactionRepository.getByReference(event.data.reference);
                if (transaction && transaction.type === 'withdrawal' && transaction.status === 'pending') {
                    // Refund the wallet
                    await WalletRepository_1.WalletRepository.creditWallet(transaction.wallet_id, transaction.amount);
                    await TransactionRepository_1.TransactionRepository.updateStatus(transaction.id, 'failed');
                }
                return (0, api_response_kit_1.Ok)(null, "Transfer failed webhook processed");
            }
            return (0, api_response_kit_1.Ok)(null, "Webhook event not handled");
        }
        catch (err) {
            return (0, api_response_kit_1.InternalError)(err.message);
        }
    }
}
exports.GiftService = GiftService;
//# sourceMappingURL=gift.service.js.map