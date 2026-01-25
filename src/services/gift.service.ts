import crypto from 'crypto';
import { WalletRepository } from "../repositories/WalletRepository";
import { TransactionRepository } from "../repositories/TransactionRepository";
import { CreatorRepository } from "../repositories/CreatorRepository";
import { WalletService } from "./wallet.service";
import { getPaymentProvider } from "../providers/PaymentProviderFactory";
import { BadRequest, InternalError, NotFound, Ok } from "@0layimika/api-response-kit";
import { FRONTEND_URL } from "../config/env";
import { MailService } from "./mail.service";

export interface InitiateGiftData {
    amount: number; // in naira
    sender_name?: string;
    sender_email: string;
    description?: string;
}

export class GiftService {
    static generateReference(): string {
        return `gift_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    }

    static async initiateGift(creatorUsername: string, data: InitiateGiftData) {
        try {
            const creator = await CreatorRepository.getOneWhere({ username: creatorUsername });
            if (!creator) {
                return NotFound("Creator not found");
            }

            if (data.amount < 100) {
                return BadRequest("Minimum gift amount is 100 Naira");
            }

            const wallet = await WalletService.getOrCreateWallet(creator.id);
            const provider = getPaymentProvider();
            const reference = this.generateReference();
            const amountInKobo = data.amount * 100;

            // Create pending transaction
            const transaction = await TransactionRepository.create({
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
            } as any);

            // Build callback URL with reference
            const callbackUrl = process.env.PAYMENT_CALLBACK_URL ||
                `${FRONTEND_URL}/payment/callback?reference=${reference}`;

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
                await TransactionRepository.updateStatus(transaction.id, 'failed');
                return BadRequest("Failed to initialize payment");
            }

            return Ok({
                authorization_url: paymentResult.authorization_url,
                reference: paymentResult.reference,
                transaction_id: transaction.id,
            }, "Payment initialized successfully");
        } catch (err: any) {
            return InternalError(err.message);
        }
    }

    static async verifyGiftPayment(reference: string) {
        try {
            const transaction = await TransactionRepository.getByReference(reference);
            if (!transaction) {
                return NotFound("Transaction not found");
            }

            if (transaction.status === 'completed') {
                return Ok({ status: 'completed' }, "Gift already processed");
            }

            const provider = getPaymentProvider();
            const verifyResult = await provider.verifyPayment(reference);

            if (verifyResult.status === 'success') {
                // Credit wallet
                await WalletService.creditWallet(
                    transaction.wallet_id,
                    transaction.amount,
                    transaction.id
                );

                // Update transaction with provider reference
                await TransactionRepository.updateStatus(
                    transaction.id,
                    'completed',
                    verifyResult.provider_reference
                );

                // Send tip notification email to creator
                await this.sendTipNotification(transaction);

                return Ok({ status: 'completed' }, "Gift received successfully");
            } else if (verifyResult.status === 'failed') {
                await TransactionRepository.updateStatus(transaction.id, 'failed');
                return BadRequest("Payment failed");
            }

            return Ok({ status: 'pending' }, "Payment is still pending");
        } catch (err: any) {
            return InternalError(err.message);
        }
    }

    private static async sendTipNotification(transaction: any) {
        try {
            const metadata = transaction.metadata as any;
            if (!metadata?.creator_id) return;

            const creator = await CreatorRepository.getOneWhere(
                { id: metadata.creator_id },
                { user: true }
            ) as any;

            if (!creator?.user?.email) return;

            const creatorName = creator.first_name || creator.username;
            const senderName = transaction.sender_name || "Anonymous";

            await MailService.sendTipNotificationEmail(
                creator.user.email,
                creatorName,
                transaction.amount,
                senderName,
                transaction.description
            );
        } catch (error) {
            console.error("Failed to send tip notification email:", error);
        }
    }

    static async handleWebhook(_provider: 'paystack' | 'kora', payload: string, signature: string, body: any) {
        try {
            const paymentProvider = getPaymentProvider();

            // Verify webhook signature
            if (!paymentProvider.verifyWebhookSignature(payload, signature)) {
                return BadRequest("Invalid webhook signature");
            }

            const event = paymentProvider.parseWebhookEvent(body);

            // Handle charge success event
            if (event.event === 'charge.success' || event.event === 'charge.completed') {
                const transaction = await TransactionRepository.getByReference(event.data.reference);
                if (!transaction) {
                    return NotFound("Transaction not found");
                }

                if (transaction.status === 'completed') {
                    return Ok(null, "Transaction already processed");
                }

                if (transaction.type === 'gift') {
                    await WalletService.creditWallet(
                        transaction.wallet_id,
                        transaction.amount,
                        transaction.id
                    );

                    // Update transaction status
                    await TransactionRepository.updateStatus(transaction.id, 'completed', event.data.reference);

                    // Send tip notification email to creator
                    await this.sendTipNotification(transaction);
                }

                return Ok(null, "Webhook processed successfully");
            }

            // Handle failed charge
            if (event.event === 'charge.failed') {
                const transaction = await TransactionRepository.getByReference(event.data.reference);
                if (transaction && transaction.status === 'pending') {
                    await TransactionRepository.updateStatus(transaction.id, 'failed');
                }
                return Ok(null, "Failed charge webhook processed");
            }

            // Handle transfer events for withdrawals
            if (event.event === 'transfer.success' || event.event === 'payout.completed') {
                const transaction = await TransactionRepository.getByReference(event.data.reference);
                if (transaction && transaction.type === 'withdrawal' && transaction.status === 'pending') {
                    await TransactionRepository.updateStatus(transaction.id, 'completed', event.data.reference);
                }
                return Ok(null, "Transfer success webhook processed");
            }

            if (event.event === 'transfer.failed' || event.event === 'payout.failed') {
                const transaction = await TransactionRepository.getByReference(event.data.reference);
                if (transaction && transaction.type === 'withdrawal' && transaction.status === 'pending') {
                    // Refund the wallet
                    await WalletRepository.creditWallet(transaction.wallet_id, transaction.amount);
                    await TransactionRepository.updateStatus(transaction.id, 'failed');
                }
                return Ok(null, "Transfer failed webhook processed");
            }

            return Ok(null, "Webhook event not handled");
        } catch (err: any) {
            return InternalError(err.message);
        }
    }
}
