import crypto from "crypto";
import { CreatorRepository } from "../repositories/CreatorRepository";
import { StoreProductRepository } from "../repositories/StoreProductRepository";
import { StoreOrderRepository } from "../repositories/StoreOrderRepository";
import { StoreDownloadTokenRepository } from "../repositories/StoreDownloadTokenRepository";
import { ServiceAvailabilityRepository } from "../repositories/ServiceAvailabilityRepository";
import { ServiceBookingRepository } from "../repositories/ServiceBookingRepository";
import { getPaymentProvider } from "../providers/PaymentProviderFactory";
import { BadRequest, InternalError, NotFound, Ok } from "@0layimika/api-response-kit";
import { FRONTEND_URL } from "../config/env";
import { StoreProductType } from "../types/store.types";
import { MailService } from "./mail.service";
import { getSignedDownloadUrl } from "./media.service";
import { WalletService } from "./wallet.service";
import { TransactionRepository } from "../repositories/TransactionRepository";

interface CreateProductData {
    type: StoreProductType;
    title: string;
    description?: string | null;
    price: number;
    currency?: string;
    cover_url?: string | null;
    is_active?: boolean;
    download_limit?: number;
    file_id?: string | null;
    file_url?: string | null;
    file_size?: number | null;
    file_type?: string | null;
    duration_minutes?: number | null;
    buffer_minutes?: number | null;
    timezone?: string | null;
    requires_address?: boolean;
}

interface UpdateProductData extends Partial<CreateProductData> {}

interface InitiatePurchaseData {
    buyer_email: string;
    buyer_name?: string;
    buyer_phone?: string;
    delivery_address?: Record<string, any> | null;
    slot_start?: string;
    slot_end?: string;
}

interface CreateAvailabilityWindowData {
    weekday: number;
    start_time: string;
    end_time: string;
    timezone: string;
}

interface HoldServiceSlotData {
    slot_start: string;
    slot_end: string;
    buyer_email?: string;
    buyer_name?: string;
    buyer_phone?: string;
    notes?: string;
}

export class StoreService {
    static generateReference(): string {
        return `store_${Date.now()}_${crypto.randomBytes(8).toString("hex")}`;
    }

    static generateDownloadToken(): string {
        return crypto.randomBytes(16).toString("hex");
    }

    static async createProduct(userId: number, data: CreateProductData) {
        try {
            const creator = await CreatorRepository.getOneWhere({ user_id: userId });
            if (!creator) return NotFound("Creator profile not found");

            if (data.type === "digital" && !data.file_url) {
                return BadRequest("Digital product requires a file");
            }

            if (data.type === "service" && !data.duration_minutes) {
                return BadRequest("Service product requires a duration");
            }

            if (data.type === "digital" && data.download_limit !== undefined && data.download_limit < 1) {
                return BadRequest("Download limit must be at least 1");
            }

            const product = await StoreProductRepository.create({
                creator_id: creator.id,
                type: data.type,
                title: data.title,
                description: data.description ?? null,
                price: data.price,
                currency: data.currency || "NGN",
                cover_url: data.cover_url ?? null,
                is_active: data.is_active ?? true,
                download_limit: data.download_limit ?? 3,
                file_id: data.file_id ?? null,
                file_url: data.file_url ?? null,
                file_size: data.file_size ?? null,
                file_type: data.file_type ?? null,
                duration_minutes: data.duration_minutes ?? null,
                buffer_minutes: data.buffer_minutes ?? null,
                timezone: data.timezone ?? null,
                requires_address: data.requires_address ?? false,
            } as any);

            return Ok(product, "Product created successfully");
        } catch (err: any) {
            return InternalError(err.message);
        }
    }

    static async updateProduct(userId: number, productId: number, data: UpdateProductData) {
        try {
            const creator = await CreatorRepository.getOneWhere({ user_id: userId });
            if (!creator) return NotFound("Creator profile not found");

            const product = await StoreProductRepository.findById(productId);
            if (!product) return NotFound("Product not found");
            if (product.creator_id !== creator.id) return BadRequest("You do not own this product");

            const updated = await StoreProductRepository.update(productId, data as any);
            return Ok(updated, "Product updated successfully");
        } catch (err: any) {
            return InternalError(err.message);
        }
    }

    static async listMyProducts(userId: number, limit = 20, offset = 0) {
        try {
            const creator = await CreatorRepository.getOneWhere({ user_id: userId });
            if (!creator) return NotFound("Creator profile not found");

            const products = await StoreProductRepository.getByCreatorId(creator.id, limit, offset);
            return Ok(products, "Products retrieved successfully");
        } catch (err: any) {
            return InternalError(err.message);
        }
    }

    static async getStorefront(username: string, limit = 50, offset = 0) {
        try {
            const creator = await CreatorRepository.getOneWhere({ username });
            if (!creator) return NotFound("Creator not found");

            const products = await StoreProductRepository.getActiveByCreatorId(creator.id, limit, offset);
            return Ok({
                creator: {
                    id: creator.id,
                    username: creator.username,
                    first_name: creator.first_name,
                    last_name: creator.last_name,
                    bio: creator.bio,
                    avatar_url: creator.avatar_url,
                },
                products,
            }, "Storefront retrieved successfully");
        } catch (err: any) {
            return InternalError(err.message);
        }
    }

    static async initiatePurchase(username: string, productId: number, data: InitiatePurchaseData) {
        try {
            const creator = await CreatorRepository.getOneWhere({ username });
            if (!creator) return NotFound("Creator not found");

            const product = await StoreProductRepository.findById(productId);
            if (!product || product.creator_id !== creator.id) return NotFound("Product not found");
            if (!product.is_active) return BadRequest("Product is not available");

            if (product.type === "physical" && !data.delivery_address) {
                return BadRequest("Delivery address is required for physical products");
            }

            if (product.type === "service" && !data.slot_start) {
                return BadRequest("Slot start is required for services");
            }

            const reference = this.generateReference();
            const provider = getPaymentProvider();

            const order = await StoreOrderRepository.create({
                creator_id: creator.id,
                product_id: product.id,
                buyer_email: data.buyer_email,
                buyer_name: data.buyer_name ?? null,
                buyer_phone: data.buyer_phone ?? null,
                delivery_address: data.delivery_address ?? null,
                status: "pending",
                amount: product.price,
                currency: product.currency,
                reference,
                provider: provider.providerName,
                metadata: {
                    product_type: product.type,
                    slot_start: data.slot_start ?? null,
                    slot_end: data.slot_end ?? null,
                },
            } as any);

            const amountInKobo = product.price * 100;
            const callbackUrl = `${FRONTEND_URL}/payment/store?reference=${reference}&type=${product.type}`;

            const paymentResult = await provider.initializePayment({
                amount: amountInKobo,
                email: data.buyer_email,
                reference,
                metadata: {
                    order_id: order.id,
                    creator_id: creator.id,
                    product_id: product.id,
                    type: "store_order",
                    product_type: product.type,
                },
                callback_url: callbackUrl,
            });

            if (!paymentResult.success) {
                await StoreOrderRepository.updateStatus(order.id, "failed");
                return BadRequest("Failed to initialize payment");
            }

            return Ok({
                authorization_url: paymentResult.authorization_url,
                reference: paymentResult.reference,
                order_id: order.id,
            }, "Payment initialized successfully");
        } catch (err: any) {
            return InternalError(err.message);
        }
    }

    static async verifyPurchase(reference: string) {
        try {
            const order = await StoreOrderRepository.getByReference(reference);
            if (!order) return NotFound("Order not found");

            const product = await StoreProductRepository.findById(order.product_id);
            if (!product) return NotFound("Product not found");

            if (order.status === "paid") {
                const existingTransaction = await TransactionRepository.getByReference(order.reference);
                if (!existingTransaction) {
                    const wallet = await WalletService.getOrCreateWallet(order.creator_id);
                    const fee = Math.round(order.amount * 0.05);
                    const netAmount = order.amount - fee;
                    const transaction = await TransactionRepository.create({
                        wallet_id: wallet.id,
                        type: "store",
                        amount: netAmount,
                        currency: order.currency,
                        status: "pending",
                        reference: order.reference,
                        provider: order.provider,
                        provider_reference: order.provider_reference || null,
                        description: `Payment for ${product.title}`,
                        sender_name: order.buyer_name || null,
                        sender_email: order.buyer_email || null,
                        metadata: {
                            order_id: order.id,
                            product_id: product.id,
                            product_type: product.type,
                            gross_amount: order.amount,
                            fee_amount: fee,
                        },
                    } as any);
                    await WalletService.creditWallet(wallet.id, netAmount, transaction.id);
                }

                if (product.type === "digital") {
                    let tokenRecord = await StoreDownloadTokenRepository.getOneWhere({ order_id: order.id });
                    if (!tokenRecord) {
                        tokenRecord = await StoreDownloadTokenRepository.create({
                            order_id: order.id,
                            token: this.generateDownloadToken(),
                            max_downloads: product.download_limit || 3,
                        } as any);
                    }
                    return Ok({
                        status: "paid",
                        download_token: tokenRecord.token,
                        max_downloads: tokenRecord.max_downloads,
                    }, "Order already processed");
                }
                return Ok({ status: "paid" }, "Order already processed");
            }

            const provider = getPaymentProvider();
            const verifyResult = await provider.verifyPayment(reference);

            if (verifyResult.status === "success") {
                await StoreOrderRepository.updateStatus(order.id, "paid", verifyResult.provider_reference);

                const wallet = await WalletService.getOrCreateWallet(order.creator_id);
                const fee = Math.round(order.amount * 0.05);
                const netAmount = order.amount - fee;

                const transaction = await TransactionRepository.create({
                    wallet_id: wallet.id,
                    type: "store",
                    amount: netAmount,
                    currency: order.currency,
                    status: "pending",
                    reference: order.reference,
                    provider: order.provider,
                    provider_reference: verifyResult.provider_reference || null,
                    description: `Payment for ${product.title}`,
                    sender_name: order.buyer_name || null,
                    sender_email: order.buyer_email || null,
                    metadata: {
                        order_id: order.id,
                        product_id: product.id,
                        product_type: product.type,
                        gross_amount: order.amount,
                        fee_amount: fee,
                    },
                } as any);

                await WalletService.creditWallet(wallet.id, netAmount, transaction.id);

                let bookingDetails: any = null;

                if (product.type === "digital") {
                    let tokenRecord = await StoreDownloadTokenRepository.getOneWhere({ order_id: order.id });
                    if (!tokenRecord) {
                        tokenRecord = await StoreDownloadTokenRepository.create({
                            order_id: order.id,
                            token: this.generateDownloadToken(),
                            max_downloads: product.download_limit || 3,
                        } as any);
                    }
                }

                if (product.type === "service") {
                    const slotStart = order.metadata?.slot_start;
                    if (slotStart) {
                        const startDate = new Date(slotStart);
                        const endDate = new Date(startDate.getTime() + (product.duration_minutes || 30) * 60000);
                        const booking = await ServiceBookingRepository.create({
                            service_id: product.id,
                            creator_id: order.creator_id,
                            order_id: order.id,
                            slot_start: startDate.toISOString(),
                            slot_end: endDate.toISOString(),
                            status: "confirmed",
                            buyer_email: order.buyer_email,
                            buyer_name: order.buyer_name,
                            buyer_phone: order.buyer_phone,
                        } as any);
                        bookingDetails = booking;
                    }
                }

                const creator = await CreatorRepository.getOneWhere({ id: order.creator_id }, { user: true }) as any;
                if (creator?.user?.email) {
                    await MailService.sendCreatorOrderEmail(
                        creator.user.email,
                        creator.first_name || creator.username,
                        product.title,
                        order.amount,
                        order.buyer_email,
                        order.buyer_name,
                        order.reference,
                        {
                            deliveryAddress: order.delivery_address || null,
                            bookingSlot: bookingDetails
                                ? { start: bookingDetails.slot_start, end: bookingDetails.slot_end }
                                : null,
                        }
                    );
                }

                await MailService.sendOrderConfirmationEmail(
                    order.buyer_email,
                    order.buyer_name,
                    product.title,
                    order.amount,
                    order.reference
                );

                if (product.type === "digital") {
                    const tokenRecord = await StoreDownloadTokenRepository.getOneWhere({ order_id: order.id });
                    return Ok({
                        status: "paid",
                        download_token: tokenRecord?.token,
                        max_downloads: tokenRecord?.max_downloads,
                    }, "Payment verified");
                }

                return Ok({ status: "paid" }, "Payment verified");
            }

            if (verifyResult.status === "failed") {
                await StoreOrderRepository.updateStatus(order.id, "failed");
                return BadRequest("Payment failed");
            }

            return Ok({ status: "pending" }, "Payment is still pending");
        } catch (err: any) {
            return InternalError(err.message);
        }
    }

    static async getDownload(token: string) {
        try {
            const tokenRecord = await StoreDownloadTokenRepository.getByToken(token);
            if (!tokenRecord) return NotFound("Download token not found");

            if (tokenRecord.revoked_at) return BadRequest("Download token revoked");
            if (tokenRecord.download_count >= tokenRecord.max_downloads) {
                return BadRequest("Download limit reached");
            }

            const order = await StoreOrderRepository.findById(tokenRecord.order_id);
            if (!order || order.status !== "paid") return BadRequest("Order not available");

            const product = await StoreProductRepository.findById(order.product_id);
            if (!product || product.type !== "digital") return BadRequest("Product not available");
            if (!product.file_url && !product.file_id) return BadRequest("File not available");

            const downloadUrl = product.file_id
                ? getSignedDownloadUrl(product.file_id, product.file_type || undefined)
                : product.file_url as string;

            await StoreDownloadTokenRepository.incrementDownload(tokenRecord.id);

            return Ok({
                file_url: downloadUrl,
                downloads_used: tokenRecord.download_count + 1,
                downloads_remaining: Math.max(0, tokenRecord.max_downloads - tokenRecord.download_count - 1),
            }, "Download ready");
        } catch (err: any) {
            return InternalError(err.message);
        }
    }

    static async createAvailabilityWindow(userId: number, data: CreateAvailabilityWindowData) {
        try {
            const creator = await CreatorRepository.getOneWhere({ user_id: userId });
            if (!creator) return NotFound("Creator profile not found");

            const window = await ServiceAvailabilityRepository.create({
                creator_id: creator.id,
                weekday: data.weekday,
                start_time: data.start_time,
                end_time: data.end_time,
                timezone: data.timezone,
            } as any);

            return Ok(window, "Availability window created");
        } catch (err: any) {
            return InternalError(err.message);
        }
    }

    static async listAvailabilityWindows(userId: number) {
        try {
            const creator = await CreatorRepository.getOneWhere({ user_id: userId });
            if (!creator) return NotFound("Creator profile not found");

            const windows = await ServiceAvailabilityRepository.getByCreatorId(creator.id);
            return Ok(windows, "Availability windows retrieved");
        } catch (err: any) {
            return InternalError(err.message);
        }
    }

    static async listBookings(userId: number, limit = 20, offset = 0) {
        try {
            const creator = await CreatorRepository.getOneWhere({ user_id: userId });
            if (!creator) return NotFound("Creator profile not found");

            const bookings = await ServiceBookingRepository.getByCreatorId(creator.id, limit, offset);
            return Ok(bookings, "Bookings retrieved");
        } catch (err: any) {
            return InternalError(err.message);
        }
    }

    static async listOrders(userId: number, limit = 20, offset = 0) {
        try {
            const creator = await CreatorRepository.getOneWhere({ user_id: userId });
            if (!creator) return NotFound("Creator profile not found");

            const orders = await StoreOrderRepository.getByCreatorIdWithProduct(creator.id, limit, offset);
            return Ok(orders, "Orders retrieved");
        } catch (err: any) {
            return InternalError(err.message);
        }
    }

    static async getOrderByReference(reference: string) {
        try {
            const order = await StoreOrderRepository.getByReferenceWithProduct(reference);
            if (!order) return NotFound("Order not found");

            let downloadToken: string | null = null;
            if (order.status === "paid" && order.product?.type === "digital") {
                let tokenRecord = await StoreDownloadTokenRepository.getOneWhere({ order_id: order.id });
                if (!tokenRecord) {
                    tokenRecord = await StoreDownloadTokenRepository.create({
                        order_id: order.id,
                        token: this.generateDownloadToken(),
                        max_downloads: order.product?.download_limit || 3,
                    } as any);
                }
                downloadToken = tokenRecord?.token || null;
            }

            let booking: any = null;
            if (order.product?.type === "service") {
                booking = await ServiceBookingRepository.getOneWhere({ order_id: order.id });
            }

            return Ok({
                order,
                download_token: downloadToken,
                booking,
            }, "Order retrieved");
        } catch (err: any) {
            return InternalError(err.message);
        }
    }

    static async resendOrderEmails(userId: number, orderId: number) {
        try {
            const creator = await CreatorRepository.getOneWhere({ user_id: userId }, { user: true }) as any;
            if (!creator) return NotFound("Creator profile not found");

            const order = await StoreOrderRepository.findById(orderId, { product: true } as any);
            if (!order) return NotFound("Order not found");
            if (order.creator_id !== creator.id) return BadRequest("You do not own this order");
            if (order.status !== "paid") return BadRequest("Order is not paid");

            const product = (order as any).product;
            const booking = await ServiceBookingRepository.getOneWhere({ order_id: order.id });

            if (creator?.user?.email) {
                await MailService.sendCreatorOrderEmail(
                    creator.user.email,
                    creator.first_name || creator.username,
                    product?.title || "Product",
                    order.amount,
                    order.buyer_email,
                    order.buyer_name,
                    order.reference,
                    {
                        deliveryAddress: order.delivery_address || null,
                        bookingSlot: booking
                            ? { start: booking.slot_start, end: booking.slot_end }
                            : null,
                    }
                );
            }

            await MailService.sendOrderConfirmationEmail(
                order.buyer_email,
                order.buyer_name,
                product?.title || "Product",
                order.amount,
                order.reference
            );

            return Ok(null, "Order emails resent");
        } catch (err: any) {
            return InternalError(err.message);
        }
    }

    private static buildSlotsForDay(
        day: Date,
        window: { start_time: string; end_time: string; timezone: string },
        durationMinutes: number,
        bufferMinutes: number
    ): Array<{ start: Date; end: Date }> {
        const [startHour, startMin] = window.start_time.split(":").map(Number);
        const [endHour, endMin] = window.end_time.split(":").map(Number);

        const start = new Date(day);
        start.setHours(startHour, startMin, 0, 0);
        const end = new Date(day);
        end.setHours(endHour, endMin, 0, 0);

        const slots: Array<{ start: Date; end: Date }> = [];
        const step = durationMinutes + bufferMinutes;

        let currentStart = new Date(start);
        while (currentStart.getTime() + durationMinutes * 60000 <= end.getTime()) {
            const currentEnd = new Date(currentStart.getTime() + durationMinutes * 60000);
            slots.push({ start: currentStart, end: currentEnd });
            currentStart = new Date(currentStart.getTime() + step * 60000);
        }

        return slots;
    }

    private static async computeAvailableSlots(
        creatorId: number,
        service: any,
        from: string,
        to: string
    ): Promise<Array<{ start: string; end: string }>> {
        const windows = await ServiceAvailabilityRepository.getByCreatorId(creatorId);
        const duration = service.duration_minutes || 30;
        const buffer = service.buffer_minutes || 0;

        const startDate = new Date(from);
        const endDate = new Date(to);
        const now = new Date();

        const bookings = await ServiceBookingRepository.getAllWhere(
            { service_id: service.id },
            {},
            (qb) => {
                qb.whereIn("status", ["hold", "confirmed"])
                  .whereBetween("slot_start", [startDate.toISOString(), endDate.toISOString()]);
            }
        );

        const bookedRanges = bookings.map((b: any) => ({
            start: new Date(b.slot_start),
            end: new Date(b.slot_end),
        }));

        const slots: Array<{ start: string; end: string }> = [];
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const weekday = d.getDay();
            const dayWindows = windows.filter((w) => w.weekday === weekday);
            for (const window of dayWindows) {
                const daySlots = this.buildSlotsForDay(new Date(d), window, duration, buffer);
                for (const slot of daySlots) {
                    if (slot.start < now) continue;
                    const overlaps = bookedRanges.some((b) =>
                        slot.start < b.end && slot.end > b.start
                    );
                    if (!overlaps) {
                        slots.push({ start: slot.start.toISOString(), end: slot.end.toISOString() });
                    }
                }
            }
        }

        return slots;
    }

    static async getServiceSlots(username: string, serviceId: number, from: string, to: string) {
        try {
            const creator = await CreatorRepository.getOneWhere({ username });
            if (!creator) return NotFound("Creator not found");

            const service = await StoreProductRepository.findById(serviceId);
            if (!service || service.creator_id !== creator.id) return NotFound("Service not found");
            if (service.type !== "service") return BadRequest("Product is not a service");

            const slots = await this.computeAvailableSlots(creator.id, service, from, to);
            return Ok({ slots }, "Available slots retrieved");
        } catch (err: any) {
            return InternalError(err.message);
        }
    }

    static async holdServiceSlot(username: string, serviceId: number, data: HoldServiceSlotData) {
        try {
            const creator = await CreatorRepository.getOneWhere({ username });
            if (!creator) return NotFound("Creator not found");

            const service = await StoreProductRepository.findById(serviceId);
            if (!service || service.creator_id !== creator.id) return NotFound("Service not found");
            if (service.type !== "service") return BadRequest("Product is not a service");

            await ServiceBookingRepository.expireHolds();

            const holdExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

            const startDate = new Date(data.slot_start);
            const expectedEnd = new Date(startDate.getTime() + (service.duration_minutes || 30) * 60000);
            const providedEnd = new Date(data.slot_end);
            if (startDate >= expectedEnd) return BadRequest("Invalid slot selection");
            if (Math.abs(providedEnd.getTime() - expectedEnd.getTime()) > 60000) {
                return BadRequest("Slot end time does not match service duration");
            }

            const dayStart = new Date(startDate);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(startDate);
            dayEnd.setHours(23, 59, 59, 999);

            const availableSlots = await this.computeAvailableSlots(
                creator.id,
                service,
                dayStart.toISOString(),
                dayEnd.toISOString()
            );

            const isValidSlot = availableSlots.some(
                (slot) => slot.start === startDate.toISOString() && slot.end === expectedEnd.toISOString()
            );

            if (!isValidSlot) {
                return BadRequest("Selected slot is not available");
            }

            const booking = await ServiceBookingRepository.create({
                service_id: service.id,
                creator_id: creator.id,
                slot_start: data.slot_start,
                slot_end: expectedEnd.toISOString(),
                status: "hold",
                hold_expires_at: holdExpiresAt,
                buyer_email: data.buyer_email ?? null,
                buyer_name: data.buyer_name ?? null,
                buyer_phone: data.buyer_phone ?? null,
                notes: data.notes ?? null,
            } as any);

            return Ok(booking, "Slot held successfully");
        } catch (err: any) {
            if (err?.code === "23505") {
                return BadRequest("Slot is no longer available");
            }
            return InternalError(err.message);
        }
    }
}
