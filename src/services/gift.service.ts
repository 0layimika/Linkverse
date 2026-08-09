import crypto from 'crypto';
import { WalletRepository } from "../repositories/WalletRepository";
import { TransactionRepository } from "../repositories/TransactionRepository";
import { CreatorRepository } from "../repositories/CreatorRepository";
import { WalletService } from "./wallet.service";
import { getPaymentProvider } from "../providers/PaymentProviderFactory";
import { BachsProvider, KoraProvider, PaystackProvider } from "../providers/PaymentProviderFactory";
import { BadRequest, InternalError, NotFound, Ok } from "@0layimika/api-response-kit";
import { FRONTEND_URL } from "../config/env";
import { MailService } from "./mail.service";
import knex from "../db/knex";
import { StoreService } from "./store.service";

export interface InitiateGiftData {
    amount: number; // major currency unit
    currency?: 'NGN' | 'USD';
    sender_name?: string;
    sender_email: string;
    description?: string;
}

export class GiftService {
    private static async claimWebhook(provider: string, body: any, payload: string, signature: string): Promise<{ duplicate: boolean; eventId: string }> {
        const eventId = String(body?.id || body?.event_id || body?.data?.id || crypto.createHash('sha256').update(payload).digest('hex'));
        const inserted = await knex("payment_webhook_events").insert({
            provider,
            event_id: eventId,
            event_type: body?.event || body?.type || body?.event_type || null,
            signature: signature || null,
            payload: body,
            status: "processing",
            attempts: 1,
        }).onConflict(["provider", "event_id"]).ignore();
        if (!inserted.length) {
            const existing = await knex("payment_webhook_events").where({ provider, event_id: eventId }).first();
            // A previous worker may have crashed after claiming the event. Only a
            // fully processed event is a duplicate; failed/interrupted processing
            // must be allowed to retry because Bachs delivers at least once.
            if (existing?.status === "processed") return { duplicate: true, eventId };
            await knex("payment_webhook_events").where({ provider, event_id: eventId }).update({ status: "processing", attempts: knex.raw("attempts + 1"), error_message: null });
            return { duplicate: false, eventId };
        }
        return { duplicate: false, eventId };
    }

    private static async completeWebhook(provider: string, eventId: string): Promise<void> {
        await knex("payment_webhook_events").where({ provider, event_id: eventId }).update({ status: "processed", processed_at: knex.fn.now(), error_message: null });
    }
    static generateReference(): string {
        return `gift_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    }

    static async initiateGift(creatorUsername: string, data: InitiateGiftData) {
        try {
            const creator = await CreatorRepository.findByUsername(creatorUsername);
            if (!creator) {
                return NotFound("Creator not found");
            }

            const currency = data.currency || 'NGN';
            const minimum = currency === 'USD' ? 1 : 1000;
            if (data.amount < minimum) {
                return BadRequest(`Minimum gift amount is ${minimum} ${currency}`);
            }

            const wallet = await WalletService.getOrCreateWallet(creator.id, currency);
            const provider = getPaymentProvider();
            const reference = this.generateReference();
            const amountInMinor = Math.round(data.amount * 100);

            // Create pending transaction
            const transaction = await TransactionRepository.create({
                wallet_id: wallet.id,
                type: 'gift',
                amount: data.amount,
                currency,
                status: 'pending',
                reference,
                provider: provider.providerName,
                description: data.description || null,
                sender_name: data.sender_name || null,
                sender_email: data.sender_email,
                metadata: {
                    creator_username: creator.username,
                    creator_id: creator.id,
                },
            } as any);

            // Build callback URL with reference
            const callbackUrl = `${FRONTEND_URL}/payment/callback?reference=${reference}`;

            // Initialize payment
            const paymentResult = await provider.initializePayment({
                amount: amountInMinor,
                email: data.sender_email,
                reference,
                metadata: {
                    transaction_id: transaction.id,
                    creator_id: creator.id,
                    type: 'gift',
                },
                callback_url: callbackUrl,
                currency,
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
                transaction.description,
                transaction.currency || "NGN"
            );
        } catch (error) {
            console.error("Failed to send tip notification email:", error);
        }
    }

    static async handleWebhook(_provider: 'paystack' | 'kora' | 'bachs', payload: string, signature: string, body: any, timestamp?: string) {
        let claimedWebhook: { eventId: string } | null = null;
        try {
            console.log('[Bachs][webhook] processing:start', { provider: _provider, eventId: body?.id, eventType: body?.type, timestamp });
            const paymentProvider = _provider === 'kora'
                ? new KoraProvider()
                : _provider === 'bachs' ? new BachsProvider() : new PaystackProvider();

            // Verify webhook signature
            const signatureValid = paymentProvider.verifyWebhookSignature(payload, signature, timestamp);
            console.log('[Bachs][webhook] processing:signature', { valid: signatureValid });
            if (!signatureValid) {
                return BadRequest("Invalid webhook signature");
            }

            const event = paymentProvider.parseWebhookEvent(body);
            console.log('[Bachs][webhook] processing:parsed', { event: event.event, reference: event.data.reference, status: event.data.status, amount: event.data.amount });
            const claim = await this.claimWebhook(_provider, body, payload, signature);
            console.log('[Bachs][webhook] processing:claim', claim);
            claimedWebhook = { eventId: claim.eventId };
            if (claim.duplicate) return Ok(null, "Webhook already processed");

            // Handle charge success event
            if (event.event === 'charge.success' || event.event === 'charge.completed' || event.event === 'collection.succeeded' || event.event === 'checkout.completed') {
                const transaction = await TransactionRepository.getByReference(event.data.reference);
                if (!transaction) {
                    if (_provider === 'bachs' && event.data.reference) {
                        console.log('[Bachs][webhook] processing:store-fulfillment:start', { reference: event.data.reference });
                        const status = String(event.data.status || '').toLowerCase();
                        const storeResult = await StoreService.verifyPurchase(event.data.reference, {
                            status: event.event === 'checkout.completed' || status === 'succeeded' || status === 'accepted' || status === 'completed' ? 'success' : 'pending',
                            provider_reference: event.data.reference,
                            amount: Number(event.data.amount || 0),
                            currency: event.data.currency,
                        });
                        console.log('[Bachs][webhook] processing:store-fulfillment:result', storeResult);
                        await this.completeWebhook(_provider, claim.eventId);
                        return storeResult;
                    }
                    return NotFound("Transaction not found");
                }

                if (transaction.status === 'completed') {
                    return Ok(null, "Transaction already processed");
                }

                if (transaction.type === 'gift') {
                    console.log('[Bachs][webhook] processing:gift-credit:start', { transactionId: transaction.id, walletId: transaction.wallet_id });
                    // Resolve amount from provider event payload when available.
                    // Paystack sends minor units (kobo); Kora sends major units (naira).
                    // Bachs collection events may contain a settlement/converted
                    // amount (not the creator's gift amount). Our transaction is
                    // the source of truth for the amount to credit.
                    const amountFromEvent = Number(event.data.amount);
                    if (_provider === 'bachs' && event.data.currency && String(event.data.currency).toUpperCase() === String(transaction.currency).toUpperCase() && Number.isFinite(amountFromEvent) && Math.abs(amountFromEvent - Number(transaction.amount)) > 0.01) {
                        throw new Error(`Webhook amount mismatch for ${transaction.reference}: expected ${transaction.amount} ${transaction.currency}, received ${amountFromEvent} ${event.data.currency}`);
                    }
                    const creditedAmount = _provider === 'bachs'
                        ? Number(transaction.amount)
                        : Number.isFinite(amountFromEvent) && amountFromEvent > 0
                            ? (_provider === 'paystack' ? amountFromEvent / 100 : amountFromEvent)
                            : transaction.amount;
                    await WalletService.creditWallet(
                        transaction.wallet_id,
                        creditedAmount,
                        transaction.id
                    );

                    // Update transaction status
                    await TransactionRepository.updateStatus(transaction.id, 'completed', event.data.reference);

                    // Send tip notification email to creator
                    await this.sendTipNotification(transaction);
                    console.log('[Bachs][webhook] processing:gift-credit:complete', { transactionId: transaction.id });
                }

                await this.completeWebhook(_provider, claim.eventId);
                return Ok(null, "Webhook processed successfully");
            }

            // Handle failed charge
            if (event.event === 'charge.failed' || event.event === 'collection.failed' || event.event === 'checkout.expired') {
                const transaction = await TransactionRepository.getByReference(event.data.reference);
                if (transaction && transaction.status === 'pending') {
                    await TransactionRepository.updateStatus(transaction.id, 'failed');
                }
                await this.completeWebhook(_provider, claim.eventId);
                return Ok(null, "Failed charge webhook processed");
            }

            // Handle transfer events for withdrawals
            if (event.event === 'transfer.success' || event.event === 'payout.completed' || event.event === 'payout.paid') {
                const transaction = await TransactionRepository.getByReference(event.data.reference);
                if (transaction && event.data.currency && event.data.amount !== undefined && String(event.data.currency).toUpperCase() === String(transaction.currency).toUpperCase() && Math.abs(Number(event.data.amount) - Number(transaction.amount)) > 0.01) {
                    throw new Error(`Payout amount mismatch for ${transaction.reference}: expected ${transaction.amount} ${transaction.currency}, received ${event.data.amount} ${event.data.currency}`);
                }
                if (transaction && transaction.type === 'withdrawal' && transaction.status === 'pending') {
                    await TransactionRepository.updateStatus(transaction.id, 'completed', event.data.reference);
                }
                await this.completeWebhook(_provider, claim.eventId);
                return Ok(null, "Transfer success webhook processed");
            }

            if (event.event === 'transfer.failed' || event.event === 'payout.failed') {
                const transaction = await TransactionRepository.getByReference(event.data.reference);
                if (transaction && event.data.currency && event.data.amount !== undefined && String(event.data.currency).toUpperCase() === String(transaction.currency).toUpperCase() && Math.abs(Number(event.data.amount) - Number(transaction.amount)) > 0.01) {
                    throw new Error(`Payout amount mismatch for ${transaction.reference}: expected ${transaction.amount} ${transaction.currency}, received ${event.data.amount} ${event.data.currency}`);
                }
                if (transaction && transaction.type === 'withdrawal' && transaction.status === 'pending') {
                    // Refund the wallet
                    await WalletRepository.creditWallet(transaction.wallet_id, transaction.amount, undefined, {
                        transactionId: transaction.id,
                        reference: `transaction:${transaction.id}:refund`,
                        entryType: "withdrawal_refund",
                    });
                    await TransactionRepository.updateStatus(transaction.id, 'failed');
                }
                await this.completeWebhook(_provider, claim.eventId);
                return Ok(null, "Transfer failed webhook processed");
            }

            await this.completeWebhook(_provider, claim.eventId);
            console.log('[Bachs][webhook] processing:complete', { eventId: claim.eventId, event: event.event });
            return Ok(null, "Webhook event not handled");
        } catch (err: any) {
            console.error('[Bachs][webhook] processing:error', { message: err.message, stack: err.stack, eventId: body?.id, eventType: body?.type, reference: body?.data?.reference });
            if (claimedWebhook) {
                await knex("payment_webhook_events").where({ provider: _provider, event_id: claimedWebhook.eventId }).update({ status: "failed", attempts: knex.raw("attempts + 1"), error_message: err.message });
            }
            return InternalError(err.message);
        }
    }
}
