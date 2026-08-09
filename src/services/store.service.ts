import crypto from "crypto";
import { CreatorRepository } from "../repositories/CreatorRepository";
import { CreatorModel } from "../models/CreatorModel";
import { StoreProductRepository } from "../repositories/StoreProductRepository";
import { StoreOrderRepository } from "../repositories/StoreOrderRepository";
import { StoreOrderItemRepository } from "../repositories/StoreOrderItemRepository";
import { StoreDownloadTokenRepository } from "../repositories/StoreDownloadTokenRepository";
import { ServiceAvailabilityRepository } from "../repositories/ServiceAvailabilityRepository";
import { ServiceBookingRepository } from "../repositories/ServiceBookingRepository";
import { getPaymentProvider } from "../providers/PaymentProviderFactory";
import { BadRequest, InternalError, NotFound, Ok } from "@0layimika/api-response-kit";
import { FRONTEND_URL } from "../config/env";
import { StoreProductType } from "../types/store.types";
import { MailService, OrderReceiptEmailData } from "./mail.service";
import { getSignedDownloadUrl } from "./media.service";
import { WalletService } from "./wallet.service";
import { TransactionRepository } from "../repositories/TransactionRepository";
import { WalletRepository } from "../repositories/WalletRepository";
import knex from "../db/knex";
import { ServiceBookingModel } from "../models/ServiceBookingModel";
import { StoreOrderModel } from "../models/StoreOrderModel";
import { ProfileConfigRepository } from "../repositories/ProfileConfigRepository";

interface CreateProductData {
    type: StoreProductType;
    title: string;
    description?: string | null;
    price: number;
    compare_at_price?: number | null;
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
    track_inventory?: boolean;
    stock_quantity?: number | null;
}

interface UpdateProductData extends Partial<CreateProductData> {}

interface InitiatePurchaseData {
    buyer_email: string;
    buyer_name: string;
    buyer_phone: string;
    delivery_address?: Record<string, any> | null;
    hold_booking_id?: number;
    hold_token?: string;
    slot_start?: string;
    slot_end?: string;
}

interface CartCheckoutData {
    buyer_email: string;
    buyer_name: string;
    buyer_phone: string;
    delivery_address?: Record<string, any> | null;
    items: Array<{ product_id: number; quantity: number }>;
}

interface CreateAvailabilityWindowData {
    weekday: number;
    start_time: string;
    end_time: string;
    timezone: string;
}

interface UpdateAvailabilityWindowData {
    weekday?: number;
    start_time?: string;
    end_time?: string;
    timezone?: string;
}

interface HoldServiceSlotData {
    slot_start: string;
    slot_end: string;
    buyer_email?: string;
    buyer_name?: string;
    buyer_phone?: string;
    notes?: string;
}

interface BlockServiceSlotData {
    service_id: number;
    slot_start: string;
    slot_end: string;
    notes?: string;
}

export class StoreService {
    private static buildOrderEmailReceipt(order: any, items: any[], fallbackTitle = "Order"): OrderReceiptEmailData {
        const subtotal = Number(order.subtotal ?? order.amount ?? 0);
        const platformFee = Number(order.platform_fee ?? (Number(order.platform_fee_minor || 0) / 100));
        const total = Number(order.total ?? order.amount ?? (subtotal + platformFee));
        return {
            buyerEmail: order.buyer_email,
            buyerName: order.buyer_name || null,
            reference: order.reference,
            currency: String(order.currency || "NGN").toUpperCase(),
            subtotal,
            platformFee,
            total,
            items: items.length > 0
                ? items.map((item) => ({
                    title: item.title_snapshot || fallbackTitle,
                    quantity: Number(item.quantity || 1),
                    unitPrice: Number(item.unit_price ?? item.line_total ?? 0),
                    lineTotal: Number(item.line_total ?? 0),
                }))
                : [{ title: fallbackTitle, quantity: 1, unitPrice: subtotal, lineTotal: subtotal }],
            deliveryAddress: order.delivery_address || null,
            createdAt: order.created_at || null,
        };
    }

    static async getStoreCurrency(userId: number) {
        const creator = await CreatorRepository.getOneWhere({ user_id: userId });
        if (!creator) return NotFound("Creator profile not found");
        return Ok({ currency: creator.store_currency || "NGN" }, "Store currency retrieved successfully");
    }

    static async setStoreCurrency(userId: number, currency: 'NGN' | 'USD') {
        try {
            const creator = await CreatorRepository.getOneWhere({ user_id: userId });
            if (!creator) return NotFound("Creator profile not found");
            const products = await StoreProductRepository.getAllWhere({ creator_id: creator.id });
            await CreatorModel.query().patch({ store_currency: currency }).where({ id: creator.id });
            if (products.length) {
                await knex("store_products").where({ creator_id: creator.id }).update({ currency, is_active: false, updated_at: knex.fn.now() });
            }
            return Ok({ currency }, "Store currency updated successfully");
        } catch (err: any) { return InternalError(err.message); }
    }
    private static readonly ORDER_EXPIRY_MINUTES = 15;
    private static PLATFORM_FEE_RATE = 0.025;
    static generateReference(): string {
        return `store_${Date.now()}_${crypto.randomBytes(8).toString("hex")}`;
    }

    static generateDownloadToken(): string {
        return crypto.randomBytes(16).toString("hex");
    }

    static generateHoldToken(): string {
        return `hold_${Date.now()}_${crypto.randomBytes(6).toString("hex")}`;
    }

    private static toAmountMinor(major: number): number {
        return Math.round(Number(major) * 100);
    }

    private static toAmountMajor(minor: number): number {
        return Number((minor / 100).toFixed(2));
    }

    private static hasValidDeliveryAddress(address: Record<string, any> | null | undefined): boolean {
        if (!address || typeof address !== "object") return false;
        const keys = ["address", "line1", "street"];
        return keys.some((key) => {
            const value = address[key];
            return typeof value === "string" && value.trim().length >= 5;
        });
    }

    /** Return reserved inventory exactly once when an order cannot be paid. */
    private static async releaseInventoryReservation(order: any): Promise<void> {
        const metadata = (order.metadata || {}) as any;
        if (metadata.inventory_released || !Array.isArray(metadata.inventory_reservations)) return;
        await knex.transaction(async (trx) => {
            const locked = await StoreOrderModel.query(trx).where({ id: order.id }).forUpdate().first();
            if (!locked) return;
            const current = (locked.metadata || {}) as any;
            if (current.inventory_released || !Array.isArray(current.inventory_reservations)) return;
            for (const reservation of current.inventory_reservations) {
                await knex("store_products").where({ id: reservation.product_id }).increment("stock_quantity", Number(reservation.quantity || 0)).transacting(trx);
            }
            await StoreOrderModel.query(trx).patch({ metadata: { ...current, inventory_released: true } }).where({ id: locked.id });
        });
    }

    private static async discardUnpaidOrder(order: any): Promise<void> {
        await this.releaseInventoryReservation(order);
        await knex.transaction(async (trx) => {
            await trx("store_order_items").where({ order_id: order.id }).del();
            await trx("store_orders").where({ id: order.id, status: "pending" }).del();
        });
    }

    static async expirePendingOrders(): Promise<void> {
        const candidates = await StoreOrderModel.query()
            .where("status", "pending")
            .whereNotNull("expires_at")
            .where("expires_at", "<=", new Date().toISOString())
            .select("id");
        for (const candidate of candidates) {
            await knex.transaction(async (trx) => {
                const order = await StoreOrderModel.query(trx).where({ id: candidate.id, status: "pending" }).forUpdate().first();
                if (!order) return;
                const metadata = (order.metadata || {}) as any;
                if (!metadata.inventory_released && Array.isArray(metadata.inventory_reservations)) {
                    for (const reservation of metadata.inventory_reservations) {
                        await trx("store_products").where({ id: reservation.product_id }).increment("stock_quantity", Number(reservation.quantity || 0));
                    }
                }
                await StoreOrderModel.query(trx).patch({
                    status: "expired",
                    metadata: { ...metadata, inventory_released: true, expiry_reason: "checkout_timeout" },
                }).where({ id: order.id });
            });
        }
    }

    private static parseTimeToMinutes(value: string): number | null {
        const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
        if (!match) return null;
        return Number(match[1]) * 60 + Number(match[2]);
    }

    private static isValidDateInput(value: string): boolean {
        const date = new Date(value);
        return !Number.isNaN(date.getTime());
    }

    private static isValidTimezone(timezone: string): boolean {
        try {
            Intl.DateTimeFormat("en-US", { timeZone: timezone }).format(new Date());
            return true;
        } catch {
            return false;
        }
    }

    private static getZonedDateParts(date: Date, timezone: string) {
        const formatter = new Intl.DateTimeFormat("en-US", {
            timeZone: timezone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            weekday: "short",
            hour12: false,
        });

        const parts = formatter.formatToParts(date).reduce<Record<string, string>>((acc, part) => {
            if (part.type !== "literal") acc[part.type] = part.value;
            return acc;
        }, {});

        const weekdayMap: Record<string, number> = {
            Sun: 0,
            Mon: 1,
            Tue: 2,
            Wed: 3,
            Thu: 4,
            Fri: 5,
            Sat: 6,
        };

        return {
            year: Number(parts.year),
            month: Number(parts.month),
            day: Number(parts.day),
            hour: Number(parts.hour),
            minute: Number(parts.minute),
            second: Number(parts.second),
            weekday: weekdayMap[parts.weekday] ?? 0,
        };
    }

    private static getTimezoneOffsetMs(date: Date, timezone: string): number {
        const zoned = this.getZonedDateParts(date, timezone);
        const asUtc = Date.UTC(
            zoned.year,
            zoned.month - 1,
            zoned.day,
            zoned.hour,
            zoned.minute,
            zoned.second
        );
        return asUtc - date.getTime();
    }

    private static zonedLocalToUtc(
        timezone: string,
        year: number,
        month: number,
        day: number,
        hour: number,
        minute: number
    ): Date {
        let utcTs = Date.UTC(year, month - 1, day, hour, minute, 0);
        for (let i = 0; i < 3; i += 1) {
            const offset = this.getTimezoneOffsetMs(new Date(utcTs), timezone);
            const adjusted = Date.UTC(year, month - 1, day, hour, minute, 0) - offset;
            if (adjusted === utcTs) break;
            utcTs = adjusted;
        }
        return new Date(utcTs);
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
            if (data.type === "physical") {
                if (data.track_inventory !== false && (data.stock_quantity === undefined || data.stock_quantity === null)) {
                    return BadRequest("Stock quantity is required for physical products");
                }
                if (data.stock_quantity !== undefined && data.stock_quantity !== null && data.stock_quantity < 0) {
                    return BadRequest("Stock quantity cannot be negative");
                }
            }

            const storeCurrency = (creator.store_currency || data.currency || "NGN").toUpperCase() as 'NGN' | 'USD';
            if (!['NGN', 'USD'].includes(storeCurrency)) return BadRequest("Store currency must be NGN or USD");
            if (data.price < (storeCurrency === 'USD' ? 1 : 1000)) return BadRequest(`Minimum product price is ${storeCurrency === 'USD' ? '$1' : '₦1,000'}`);
            if (creator.store_currency && data.currency && data.currency.toUpperCase() !== storeCurrency) return BadRequest(`All store products must use ${storeCurrency}`);
            if (!creator.store_currency) await CreatorModel.query().patch({ store_currency: storeCurrency }).where({ id: creator.id });

            const product = await StoreProductRepository.create({
                creator_id: creator.id,
                type: data.type,
                title: data.title,
                description: data.description ?? null,
                price: data.price,
                compare_at_price: data.compare_at_price ?? null,
                currency: storeCurrency,
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
                track_inventory: data.type === "physical" ? (data.track_inventory ?? true) : false,
                stock_quantity: data.type === "physical" ? (data.stock_quantity ?? 0) : null,
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

            const product = await StoreProductRepository.findVisibleById(productId);
            if (!product) return NotFound("Product not found");
            if (product.creator_id !== creator.id) return BadRequest("You do not own this product");
            const nextType = data.type || product.type;
            const nextCurrency = (creator.store_currency || product.currency || 'NGN') as 'NGN' | 'USD';
            if (data.price !== undefined && data.price < (nextCurrency === 'USD' ? 1 : 1000)) return BadRequest(`Minimum product price is ${nextCurrency === 'USD' ? '$1' : '₦1,000'}`);
            if (data.currency && data.currency.toUpperCase() !== (creator.store_currency || product.currency)) return BadRequest(`All store products must use ${creator.store_currency || product.currency}`);
            if (nextType === "physical" && (data.track_inventory ?? product.track_inventory ?? true)) {
                const nextStock = data.stock_quantity ?? product.stock_quantity;
                if (nextStock === null || nextStock === undefined) {
                    return BadRequest("Stock quantity is required for physical products");
                }
                if (nextStock < 0) {
                    return BadRequest("Stock quantity cannot be negative");
                }
            }

            const payload: any = { ...data };
            const updated = await StoreProductRepository.update(productId, payload);
            return Ok(updated, "Product updated successfully");
        } catch (err: any) {
            return InternalError(err.message);
        }
    }

    static async deleteProduct(userId: number, productId: number) {
        try {
            const creator = await CreatorRepository.getOneWhere({ user_id: userId });
            if (!creator) return NotFound("Creator profile not found");

            const product = await StoreProductRepository.findVisibleById(productId);
            if (!product) return NotFound("Product not found");
            if (product.creator_id !== creator.id) return BadRequest("You do not own this product");

            const updated = await StoreProductRepository.update(productId, {
                is_active: false,
                deleted_at: new Date().toISOString(),
            } as any);
            return Ok(updated, "Product deleted successfully");
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
            await this.expirePendingOrders();
            const creator = await CreatorRepository.findByUsername(username);
            if (!creator) return NotFound("Creator not found");

            const [products, profileConfig] = await Promise.all([
                StoreProductRepository.getActivePhysicalByCreatorId(creator.id, limit, offset),
                ProfileConfigRepository.getByCreatorId(creator.id),
            ]);
            // Store is physical-product only in the new UI. Legacy digital/service
            // records remain in the database and continue to work through old APIs.
            return Ok({
                creator: {
                    id: creator.id,
                    username: creator.username,
                    first_name: creator.first_name,
                    last_name: creator.last_name,
                    bio: creator.bio,
                    avatar_url: creator.avatar_url,
                    profile_config: profileConfig ? {
                        background_type: profileConfig.background_type,
                        background_value: profileConfig.background_value,
                        text_color: profileConfig.text_color,
                        accent_color: profileConfig.accent_color,
                        card_style: profileConfig.card_style,
                    } : null,
                },
                products,
                platform_fee_rate: this.PLATFORM_FEE_RATE,
            }, "Storefront retrieved successfully");
        } catch (err: any) {
            return InternalError(err.message);
        }
    }

    static async initiatePurchase(username: string, productId: number, data: InitiatePurchaseData) {
        try {
            await this.expirePendingOrders();
            const creator = await CreatorRepository.findByUsername(username);
            if (!creator) return NotFound("Creator not found");

            const product = await StoreProductRepository.findVisibleById(productId);
            if (!product || product.creator_id !== creator.id) return NotFound("Product not found");
            if (!product.is_active) return BadRequest("Product is not available");
            if (product.type === "physical" && product.track_inventory && (product.stock_quantity || 0) <= 0) {
                return BadRequest("Product is out of stock");
            }

            if (product.type === "physical" && !this.hasValidDeliveryAddress(data.delivery_address)) {
                return BadRequest("Delivery address is required for physical products");
            }

            await ServiceBookingRepository.expireHolds();

            const reference = this.generateReference();
            const provider = getPaymentProvider();
            const subtotalMajor = Number(product.price);
            const platformFeeMajor = Number((subtotalMajor * this.PLATFORM_FEE_RATE).toFixed(2));
            const totalMajor = Number((subtotalMajor + platformFeeMajor).toFixed(2));
            const amountMinor = this.toAmountMinor(totalMajor);
            const platformFeeMinor = this.toAmountMinor(platformFeeMajor);

            let selectedSlotStart: string | null = null;
            let selectedSlotEnd: string | null = null;
            let holdBookingId: number | null = null;
            let holdToken: string | null = null;

            if (product.type === "service") {
                let holdBooking: any = null;

                if (data.hold_booking_id || data.hold_token) {
                    const holdQuery = ServiceBookingModel.query()
                        .where({
                            service_id: product.id,
                            creator_id: creator.id,
                            status: "hold",
                        });

                    if (data.hold_booking_id) {
                        holdQuery.where("id", data.hold_booking_id);
                    }
                    if (data.hold_token) {
                        holdQuery.where("hold_token", data.hold_token);
                    }

                    holdBooking = await holdQuery.first();
                    if (!holdBooking) {
                        return BadRequest("Selected slot hold is invalid. Please reselect a slot");
                    }
                    if (
                        holdBooking.hold_expires_at &&
                        new Date(holdBooking.hold_expires_at).getTime() <= Date.now()
                    ) {
                        await ServiceBookingRepository.update(holdBooking.id, { status: "expired" } as any);
                        return BadRequest("Selected slot hold has expired. Please reselect a slot");
                    }
                } else {
                    if (!data.slot_start) {
                        return BadRequest("Slot start is required for services");
                    }
                    const startDate = new Date(data.slot_start);
                    if (Number.isNaN(startDate.getTime())) {
                        return BadRequest("Invalid slot start");
                    }
                    const expectedEnd = new Date(
                        startDate.getTime() + (product.duration_minutes || 30) * 60000
                    ).toISOString();
                    const holdResult = await this.holdServiceSlot(username, product.id, {
                        slot_start: data.slot_start,
                        slot_end: data.slot_end || expectedEnd,
                        buyer_email: data.buyer_email,
                        buyer_name: data.buyer_name,
                        buyer_phone: data.buyer_phone,
                    });
                    if (!holdResult.success || !holdResult.data) {
                        return holdResult;
                    }
                    holdBooking = holdResult.data as any;
                }

                selectedSlotStart = holdBooking.slot_start;
                selectedSlotEnd = holdBooking.slot_end;
                holdBookingId = holdBooking.id;
                holdToken = holdBooking.hold_token || null;
            }

            const order = await knex.transaction(async (trx) => {
                const inventoryReservations: Array<{ product_id: number; quantity: number }> = [];
                if (product.type === "physical" && product.track_inventory) {
                    const reserved = await trx("store_products")
                        .where({ id: product.id, is_active: true })
                        .where("stock_quantity", ">=", 1)
                        .decrement("stock_quantity", 1);
                    if (!reserved) throw new Error("Product just sold out. Please try again.");
                    inventoryReservations.push({ product_id: product.id, quantity: 1 });
                }
                return StoreOrderRepository.create({
                creator_id: creator.id,
                product_id: product.id,
                buyer_email: data.buyer_email,
                buyer_name: data.buyer_name ?? null,
                buyer_phone: data.buyer_phone ?? null,
                delivery_address: data.delivery_address ?? null,
                status: "pending",
                amount: totalMajor,
                amount_minor: amountMinor,
                subtotal: subtotalMajor,
                total: totalMajor,
                item_count: 1,
                platform_fee: platformFeeMajor,
                platform_fee_minor: platformFeeMinor,
                currency: product.currency,
                reference,
                expires_at: new Date(Date.now() + StoreService.ORDER_EXPIRY_MINUTES * 60_000).toISOString(),
                provider: provider.providerName,
                metadata: {
                    product_type: product.type,
                    item_count: 1,
                    platform_fee_rate: this.PLATFORM_FEE_RATE,
                    hold_booking_id: holdBookingId,
                    hold_token: holdToken,
                    slot_start: selectedSlotStart,
                    slot_end: selectedSlotEnd,
                    service_duration_minutes: product.type === "service" ? (product.duration_minutes || 30) : null,
                    inventory_reservations: inventoryReservations,
                    inventory_released: false,
                },
                } as any, {}, trx);
            });

            const amountInKobo = amountMinor;
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
                currency: product.currency,
            });

            if (!paymentResult.success) {
                await this.discardUnpaidOrder(order);
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

    static async verifyPurchase(reference: string, webhook?: { status?: 'success' | 'failed' | 'pending'; provider_reference?: string; amount?: number; currency?: string }) {
        try {
            await this.expirePendingOrders();
            await ServiceBookingRepository.expireHolds();

            const order = await StoreOrderRepository.getByReference(reference);
            if (!order) return NotFound("Order not found");
            if (webhook?.currency && String(webhook.currency).toUpperCase() === String(order.currency).toUpperCase() && webhook.amount !== undefined && Math.abs(Number(webhook.amount) - Number(order.amount)) > 0.01) {
                return BadRequest(`Webhook amount mismatch: expected ${order.amount} ${order.currency}, received ${webhook.amount} ${webhook.currency}`);
            }
            // Webhooks are the source of truth. Once our order is paid/failed,
            // the redirect verifier must not call a provider again.
            if (["paid", "confirmed", "processing", "shipped", "delivered"].includes(order.status as string)) {
                const tokens = await StoreDownloadTokenRepository.getAllWhere({ order_id: order.id });
                return Ok({ status: "paid", download_token: tokens[0]?.token, download_tokens: tokens }, "Order already paid");
            }
            if (["failed", "cancelled", "refunded", "expired"].includes(order.status)) {
                return Ok({ status: order.status }, "Order is not payable");
            }
            const orderItems = await StoreOrderItemRepository.getByOrderId(order.id);
            const primaryProduct = await StoreProductRepository.findVisibleById(order.product_id);
            const product = primaryProduct || (orderItems.length > 0 ? ({ title: "Cart order", type: "physical", duration_minutes: null, download_limit: 3 } as any) : null);
            if (!product) return NotFound("Product not found");

            let verifyStatus: "success" | "failed" | "pending" = webhook?.status || "success";
            let providerReference = order.provider_reference || null;
            if (webhook?.provider_reference) providerReference = webhook.provider_reference;
            if ((order.status as string) !== "paid") {
                if (!webhook) {
                    const provider = getPaymentProvider();
                    const verifyResult = await provider.verifyPayment(reference);
                    verifyStatus = verifyResult.status;
                    providerReference = verifyResult.provider_reference || providerReference;
                }

                if (verifyStatus === "pending") {
                    return Ok({ status: "pending" }, "Payment is still pending");
                }
            }

            let bookingDetails: any = null;
            let firstProcessed = false;

            await knex.transaction(async (trx) => {
                const lockedOrder = await StoreOrderModel.query(trx).where({ reference }).forUpdate().first();
                if (!lockedOrder) throw new Error("Order not found");

                const expectedAmountMinor = lockedOrder.amount_minor ?? this.toAmountMinor(Number(lockedOrder.amount));
                if (verifyStatus === "failed" && lockedOrder.status !== "paid") {
                    await StoreOrderModel.query(trx)
                        .patch({ status: "failed", provider_reference: providerReference })
                        .where({ id: lockedOrder.id });
                    const metadata = (lockedOrder.metadata || {}) as any;
                    if (!metadata.inventory_released && Array.isArray(metadata.inventory_reservations)) {
                        for (const reservation of metadata.inventory_reservations) {
                            await trx("store_products").where({ id: reservation.product_id }).increment("stock_quantity", Number(reservation.quantity || 0));
                        }
                        await StoreOrderModel.query(trx).patch({ metadata: { ...metadata, inventory_released: true } }).where({ id: lockedOrder.id });
                    }
                    return;
                }

                if (lockedOrder.status !== "paid") {
                    firstProcessed = true;
                    await StoreOrderModel.query(trx)
                        .patch({
                            status: "paid",
                            provider_reference: providerReference,
                            amount_minor: expectedAmountMinor,
                        })
                        .where({ id: lockedOrder.id });
                }

                const wallet = await WalletService.getOrCreateWallet(lockedOrder.creator_id, String(lockedOrder.currency || 'NGN').toUpperCase() as 'NGN' | 'USD');
                const feeMinor = lockedOrder.platform_fee_minor || 0;
                const subtotalMajor = Number(lockedOrder.subtotal || lockedOrder.amount);
                const subtotalMinor = this.toAmountMinor(subtotalMajor);
                const grossMajor = this.toAmountMajor(expectedAmountMinor);
                let transaction = await TransactionRepository.getByReference(lockedOrder.reference);
                if (!transaction) {
                    transaction = await TransactionRepository.create({
                        wallet_id: wallet.id,
                        type: "store",
                        amount: subtotalMajor,
                        currency: lockedOrder.currency,
                        status: "pending",
                        reference: lockedOrder.reference,
                        provider: lockedOrder.provider,
                        provider_reference: providerReference || null,
                        description: `Payment for ${product.title}`,
                        sender_name: lockedOrder.buyer_name || null,
                        sender_email: lockedOrder.buyer_email || null,
                        metadata: {
                            order_id: lockedOrder.id,
                            product_id: lockedOrder.product_id,
                            product_type: orderItems.length > 0 ? "cart" : product.type,
                            gross_amount: grossMajor,
                            subtotal_amount: subtotalMajor,
                            fee_amount: lockedOrder.platform_fee || 0,
                            gross_amount_minor: expectedAmountMinor,
                            subtotal_amount_minor: subtotalMinor,
                            fee_amount_minor: feeMinor,
                            items: orderItems.map((item) => ({
                                product_id: item.product_id,
                                title: item.title_snapshot,
                                type: item.type_snapshot,
                                quantity: item.quantity,
                                unit_price: item.unit_price,
                                line_total: item.line_total,
                            })),
                        },
                    } as any, {}, trx);
                }

                if (transaction.status !== "completed") {
                    await WalletRepository.creditWallet(wallet.id, subtotalMajor, trx, {
                        transactionId: transaction.id,
                        entryType: "store_sale",
                        reference: `transaction:${transaction.id}:credit`,
                    });
                    await TransactionRepository.updateStatus(
                        transaction.id,
                        "completed",
                        providerReference || undefined,
                        trx
                    );
                }

                const inventoryWasReserved = Array.isArray((lockedOrder.metadata || {})?.inventory_reservations);
                if (orderItems.length > 0 && !inventoryWasReserved) {
                    const physicalItemIds = orderItems
                        .filter((item) => item.type_snapshot === "physical")
                        .map((item) => item.product_id);
                    if (physicalItemIds.length > 0) {
                        const lockedProducts = await StoreProductRepository.getAllWhere(
                            {},
                            {},
                            (qb: any) => {
                                qb.whereIn("id", physicalItemIds).forUpdate();
                            }
                        ) as any[];
                        const productById = new Map(lockedProducts.map((p) => [p.id, p]));
                        for (const item of orderItems) {
                            if (item.type_snapshot !== "physical") continue;
                            const p = productById.get(item.product_id);
                            if (!p) throw new Error(`Product not found: ${item.product_id}`);
                            if (p.track_inventory && (p.stock_quantity || 0) < item.quantity) {
                                throw new Error(`Insufficient stock for ${item.title_snapshot}`);
                            }
                        }
                        for (const item of orderItems) {
                            if (item.type_snapshot !== "physical") continue;
                            const p = productById.get(item.product_id);
                            if (!p || !p.track_inventory) continue;
                            await StoreProductRepository.update(
                                p.id,
                                { stock_quantity: Number(p.stock_quantity || 0) - Number(item.quantity) } as any,
                                trx
                            );
                        }
                    }
                }
                if (orderItems.length === 0 && !inventoryWasReserved && product.type === "physical" && product.track_inventory) {
                    const liveProduct = await StoreProductRepository.findVisibleById(product.id, trx);
                    if (!liveProduct) throw new Error("Product not found");
                    if ((liveProduct.stock_quantity || 0) < 1) {
                        throw new Error(`Insufficient stock for ${product.title}`);
                    }
                    await StoreProductRepository.update(
                        liveProduct.id,
                        { stock_quantity: Number(liveProduct.stock_quantity || 0) - 1 } as any,
                        trx
                    );
                }

                const digitalItems = orderItems.filter((item) => item.type_snapshot === "digital");
                if ((product.type === "digital" && orderItems.length === 0) || digitalItems.length > 0) {
                    const targets = digitalItems.length > 0
                        ? digitalItems.map((item) => ({ order_id: lockedOrder.id, product_id: item.product_id, max_downloads: 3 }))
                        : [{ order_id: lockedOrder.id, product_id: null, max_downloads: product.download_limit || 3 }];
                    for (const target of targets) {
                        let tokenRecord = await StoreDownloadTokenRepository.getOneWhere({
                            order_id: target.order_id,
                            product_id: target.product_id,
                        } as any);
                        if (!tokenRecord) {
                            tokenRecord = await StoreDownloadTokenRepository.create({
                                order_id: target.order_id,
                                product_id: target.product_id,
                                token: this.generateDownloadToken(),
                                max_downloads: target.max_downloads,
                            } as any, {}, trx);
                        }
                    }
                }

                if (product.type === "service") {
                    const metadata = (lockedOrder.metadata || {}) as any;
                    const existingBooking = await ServiceBookingModel.query(trx).findOne({ order_id: lockedOrder.id });
                    if (existingBooking) {
                        bookingDetails = existingBooking;
                    } else if (metadata.hold_booking_id || metadata.hold_token) {
                        const holdQuery = ServiceBookingModel.query(trx)
                            .where({ service_id: product.id, creator_id: lockedOrder.creator_id, status: "hold" });
                        if (metadata.hold_booking_id) holdQuery.where("id", metadata.hold_booking_id);
                        if (metadata.hold_token) holdQuery.where("hold_token", metadata.hold_token);
                        const holdBooking = await holdQuery.forUpdate().first();

                        if (
                            holdBooking &&
                            (!holdBooking.hold_expires_at ||
                                new Date(holdBooking.hold_expires_at).getTime() > Date.now())
                        ) {
                            const confirmed = await ServiceBookingModel.query(trx)
                                .patchAndFetchById(holdBooking.id, {
                                    status: "confirmed",
                                    order_id: lockedOrder.id,
                                    hold_expires_at: null,
                                    buyer_email: lockedOrder.buyer_email,
                                    buyer_name: lockedOrder.buyer_name,
                                    buyer_phone: lockedOrder.buyer_phone,
                                });
                            bookingDetails = confirmed;
                        }
                    } else if (metadata.slot_start) {
                        const slotStart = new Date(metadata.slot_start);
                        const serviceDuration =
                            Number(metadata.service_duration_minutes) > 0
                                ? Number(metadata.service_duration_minutes)
                                : (product.duration_minutes || 30);
                        const slotEnd = new Date(
                            metadata.slot_end ||
                            slotStart.getTime() + serviceDuration * 60000
                        );
                        const overlaps = await ServiceBookingModel.query(trx)
                            .where({ service_id: product.id })
                            .whereIn("status", ["hold", "confirmed"])
                            .where("slot_start", "<", slotEnd.toISOString())
                            .where("slot_end", ">", slotStart.toISOString());
                        if (overlaps.length === 0) {
                            bookingDetails = await ServiceBookingRepository.create({
                                service_id: product.id,
                                creator_id: lockedOrder.creator_id,
                                order_id: lockedOrder.id,
                                slot_start: slotStart.toISOString(),
                                slot_end: slotEnd.toISOString(),
                                status: "confirmed",
                                buyer_email: lockedOrder.buyer_email,
                                buyer_name: lockedOrder.buyer_name,
                                buyer_phone: lockedOrder.buyer_phone,
                            } as any, {}, trx);
                        }
                    }
                }
            });

            if (verifyStatus === "failed") {
                return BadRequest("Payment failed");
            }

            if (firstProcessed) {
                const creator = await CreatorRepository.getOneWhere({ id: order.creator_id }, { user: true }) as any;
                const receipt = this.buildOrderEmailReceipt(order, orderItems as any[], product.title);
                if (creator?.user?.email) {
                    await MailService.sendCreatorOrderEmail(
                        creator.user.email,
                        creator.first_name || creator.username,
                        receipt,
                        bookingDetails
                            ? { start: bookingDetails.slot_start, end: bookingDetails.slot_end }
                            : null
                    );
                }

                await MailService.sendOrderConfirmationEmail(receipt);
            }

            if (product.type === "digital" || orderItems.some((item) => item.type_snapshot === "digital")) {
                const tokenRecord = await StoreDownloadTokenRepository.getOneWhere({ order_id: order.id });
                const tokens = await StoreDownloadTokenRepository.getAllWhere({ order_id: order.id });
                return Ok({
                    status: "paid",
                    download_token: tokenRecord?.token,
                    download_tokens: tokens,
                    max_downloads: tokenRecord?.max_downloads,
                }, firstProcessed ? "Payment verified" : "Order already processed");
            }

            return Ok({ status: "paid" }, firstProcessed ? "Payment verified" : "Order already processed");
        } catch (err: any) {
            return InternalError(err.message);
        }
    }

    static async checkoutCart(username: string, data: CartCheckoutData) {
        try {
            await this.expirePendingOrders();
            const creator = await CreatorRepository.findByUsername(username);
            if (!creator) return NotFound("Creator not found");
            if (!Array.isArray(data.items) || data.items.length === 0) return BadRequest("Cart cannot be empty");
            if (!data.buyer_name?.trim()) return BadRequest("Buyer name is required");
            if (!data.buyer_phone?.trim()) return BadRequest("Buyer phone is required");

            const merged = new Map<number, number>();
            for (const item of data.items) {
                const qty = Number(item.quantity || 0);
                if (!item.product_id || qty < 1) return BadRequest("Invalid cart item");
                merged.set(item.product_id, (merged.get(item.product_id) || 0) + qty);
            }

            const normalizedItems = Array.from(merged.entries()).map(([product_id, quantity]) => ({ product_id, quantity }));
            const products = await Promise.all(normalizedItems.map((item) => StoreProductRepository.findVisibleById(item.product_id)));

            let currency: string | null = null;
            let requiresAddress = false;
            let hasDigital = false;
            let subtotal = 0;
            const lineItems: Array<any> = [];

            for (let i = 0; i < normalizedItems.length; i += 1) {
                const item = normalizedItems[i];
                const product = products[i];
                if (!product || product.creator_id !== creator.id) return NotFound("One or more products not found");
                if (!product.is_active) return BadRequest(`Product is not available: ${product.title}`);
                if (product.type === "service") return BadRequest("Service products must be booked separately");
                if (product.type === "physical" && product.track_inventory && (product.stock_quantity || 0) <= 0) {
                    return BadRequest(`Product is out of stock: ${product.title}`);
                }

                if (!currency) currency = product.currency;
                if (currency !== product.currency) return BadRequest("All items in cart must use the same currency");

                if (product.type === "physical") requiresAddress = true;
                if (product.type === "digital") hasDigital = true;

                const lineTotal = Number(product.price) * item.quantity;
                subtotal += lineTotal;
                lineItems.push({
                    product,
                    quantity: item.quantity,
                    lineTotal,
                });
            }

            if (requiresAddress && !this.hasValidDeliveryAddress(data.delivery_address)) {
                return BadRequest("Delivery address is required for physical products");
            }

            const reference = this.generateReference();
            const provider = getPaymentProvider();
            const platformFee = Number((subtotal * this.PLATFORM_FEE_RATE).toFixed(2));
            const total = Number((subtotal + platformFee).toFixed(2));
            const amountMinor = this.toAmountMinor(total);
            const platformFeeMinor = this.toAmountMinor(platformFee);
            const callbackUrl = `${FRONTEND_URL}/payment/store?reference=${reference}&type=cart`;

            const order = await knex.transaction(async (trx) => {
                const physicalItemIds = lineItems
                    .filter((item) => item.product.type === "physical" && item.product.track_inventory)
                    .map((item) => item.product.id);
                const byId = new Map<number, any>();
                if (physicalItemIds.length > 0) {
                    const lockedProducts = await StoreProductRepository.getAllWhere(
                        {},
                        {},
                        (qb: any) => {
                            qb.whereIn("id", physicalItemIds).forUpdate();
                        }
                    ) as any[];
                    lockedProducts.forEach((p) => byId.set(p.id, p));
                    for (const item of lineItems) {
                        if (item.product.type !== "physical" || !item.product.track_inventory) continue;
                        const live = byId.get(item.product.id);
                        if (!live || Number(live.stock_quantity || 0) < Number(item.quantity)) {
                            throw new Error(`Insufficient stock for ${item.product.title}`);
                        }
                    }
                }
                for (const item of lineItems) {
                    if (item.product.type !== "physical" || !item.product.track_inventory) continue;
                    const live = byId.get(item.product.id);
                    await StoreProductRepository.update(item.product.id, {
                        stock_quantity: Number(live.stock_quantity || 0) - Number(item.quantity),
                    } as any, trx);
                }

                const createdOrder = await StoreOrderRepository.create({
                    creator_id: creator.id,
                    product_id: lineItems[0].product.id,
                    buyer_email: data.buyer_email,
                    buyer_name: data.buyer_name ?? null,
                    buyer_phone: data.buyer_phone ?? null,
                    delivery_address: data.delivery_address ?? null,
                    status: "pending",
                    amount: total,
                    amount_minor: amountMinor,
                    subtotal,
                    total,
                    item_count: lineItems.reduce((sum, l) => sum + l.quantity, 0),
                    platform_fee: platformFee,
                    platform_fee_minor: platformFeeMinor,
                    currency: currency || "NGN",
                    reference,
                    expires_at: new Date(Date.now() + StoreService.ORDER_EXPIRY_MINUTES * 60_000).toISOString(),
                    provider: provider.providerName,
                    metadata: {
                        product_type: "cart",
                        has_digital: hasDigital,
                        has_physical: requiresAddress,
                        inventory_reservations: lineItems.filter((item) => item.product.type === "physical" && item.product.track_inventory).map((item) => ({ product_id: item.product.id, quantity: item.quantity })),
                        inventory_released: false,
                        platform_fee_rate: this.PLATFORM_FEE_RATE,
                    },
                } as any, {}, trx);

                for (const item of lineItems) {
                    await StoreOrderItemRepository.create({
                        order_id: createdOrder.id,
                        product_id: item.product.id,
                        title_snapshot: item.product.title,
                        type_snapshot: item.product.type,
                        unit_price: Number(item.product.price),
                        quantity: item.quantity,
                        line_total: item.lineTotal,
                        currency: item.product.currency,
                        metadata: null,
                    } as any, {}, trx);
                }

                return createdOrder;
            });

            const paymentResult = await provider.initializePayment({
                amount: amountMinor,
                email: data.buyer_email,
                reference,
                metadata: {
                    order_id: order.id,
                    creator_id: creator.id,
                    type: "store_order",
                    product_type: "cart",
                    item_count: order.item_count,
                },
                callback_url: callbackUrl,
                currency: currency || "NGN",
            });

            if (!paymentResult.success) {
                await this.discardUnpaidOrder(order);
                return BadRequest("Failed to initialize payment");
            }

            return Ok({
                authorization_url: paymentResult.authorization_url,
                reference: paymentResult.reference,
                order_id: order.id,
            }, "Cart payment initialized successfully");
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

            const productId = tokenRecord.product_id || order.product_id;
            const product = await StoreProductRepository.findVisibleById(productId);
            if (!product || product.type !== "digital") return BadRequest("Product not available");
            if (!product.file_url && !product.file_id) return BadRequest("File not available");

            // Prefer the original uploaded URL (same delivery pattern as images) for compatibility.
            // Fall back to signed URL generation when only file_id is available.
            const downloadUrl = product.file_url
                ? (product.file_url as string)
                : getSignedDownloadUrl(product.file_id as string, product.file_type || undefined);

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

            const startMinutes = this.parseTimeToMinutes(data.start_time);
            const endMinutes = this.parseTimeToMinutes(data.end_time);
            if (startMinutes === null || endMinutes === null) {
                return BadRequest("Invalid time format. Use HH:MM (24-hour)");
            }
            if (!this.isValidTimezone(data.timezone)) {
                return BadRequest("Invalid timezone");
            }
            if (startMinutes >= endMinutes) {
                return BadRequest("End time must be after start time");
            }

            const existingWindows = await ServiceAvailabilityRepository.getByCreatorId(creator.id);
            const overlaps = existingWindows.some((w: any) => {
                if (w.weekday !== data.weekday) return false;
                if ((w.timezone || "").trim() !== (data.timezone || "").trim()) return false;
                const existingStart = this.parseTimeToMinutes(w.start_time);
                const existingEnd = this.parseTimeToMinutes(w.end_time);
                if (existingStart === null || existingEnd === null) return false;
                return startMinutes < existingEnd && endMinutes > existingStart;
            });

            if (overlaps) {
                return BadRequest("Availability window overlaps an existing window");
            }

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

    static async updateAvailabilityWindow(userId: number, availabilityId: number, data: UpdateAvailabilityWindowData) {
        try {
            const creator = await CreatorRepository.getOneWhere({ user_id: userId });
            if (!creator) return NotFound("Creator profile not found");

            const existing = await ServiceAvailabilityRepository.findById(availabilityId);
            if (!existing || existing.creator_id !== creator.id) {
                return NotFound("Availability window not found");
            }

            const nextWindow = {
                weekday: data.weekday ?? existing.weekday,
                start_time: data.start_time ?? existing.start_time,
                end_time: data.end_time ?? existing.end_time,
                timezone: data.timezone ?? existing.timezone,
            };

            const startMinutes = this.parseTimeToMinutes(nextWindow.start_time);
            const endMinutes = this.parseTimeToMinutes(nextWindow.end_time);
            if (startMinutes === null || endMinutes === null) {
                return BadRequest("Invalid time format. Use HH:MM (24-hour)");
            }
            if (startMinutes >= endMinutes) {
                return BadRequest("End time must be after start time");
            }
            if (!this.isValidTimezone(nextWindow.timezone)) {
                return BadRequest("Invalid timezone");
            }

            const windows = await ServiceAvailabilityRepository.getByCreatorId(creator.id);
            const overlaps = windows.some((w: any) => {
                if (w.id === availabilityId) return false;
                if (w.weekday !== nextWindow.weekday) return false;
                if ((w.timezone || "").trim() !== (nextWindow.timezone || "").trim()) return false;
                const existingStart = this.parseTimeToMinutes(w.start_time);
                const existingEnd = this.parseTimeToMinutes(w.end_time);
                if (existingStart === null || existingEnd === null) return false;
                return startMinutes < existingEnd && endMinutes > existingStart;
            });

            if (overlaps) {
                return BadRequest("Availability window overlaps an existing window");
            }

            const updated = await ServiceAvailabilityRepository.update(availabilityId, nextWindow as any);
            return Ok(updated, "Availability window updated");
        } catch (err: any) {
            return InternalError(err.message);
        }
    }

    static async deleteAvailabilityWindow(userId: number, availabilityId: number) {
        try {
            const creator = await CreatorRepository.getOneWhere({ user_id: userId });
            if (!creator) return NotFound("Creator profile not found");

            const existing = await ServiceAvailabilityRepository.findById(availabilityId);
            if (!existing || existing.creator_id !== creator.id) {
                return NotFound("Availability window not found");
            }

            await ServiceAvailabilityRepository.deleteRecordById(availabilityId);
            return Ok(null, "Availability window deleted");
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

    static async updateOrderStatus(userId: number, orderId: number, status: "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded") {
        try {
            const creator = await CreatorRepository.getOneWhere({ user_id: userId });
            if (!creator) return NotFound("Creator profile not found");

            const order = await StoreOrderRepository.findById(orderId);
            if (!order || order.creator_id !== creator.id) return NotFound("Order not found");

            if (order.status === status) return Ok(order, "Order status already updated");

            if (status === "refunded" && !["paid", "confirmed", "processing", "shipped", "delivered"].includes(order.status)) {
                return BadRequest("Only paid orders can be marked as refunded");
            }
            if (status === "cancelled" && ["paid", "confirmed", "processing", "shipped", "delivered"].includes(order.status)) {
                return BadRequest("Paid orders cannot be cancelled. Use refunded");
            }
            const allowedTransitions: Record<string, string[]> = {
                pending: ["cancelled"],
                paid: ["confirmed", "refunded"],
                confirmed: ["processing", "refunded"],
                processing: ["delivered", "shipped", "refunded"],
                // Existing users may already have orders in the legacy shipped state.
                shipped: ["delivered", "refunded"],
            };
            if (!allowedTransitions[order.status]?.includes(status)) {
                return BadRequest(`Order cannot move from ${order.status} to ${status}`);
            }

            const updated = await StoreOrderRepository.transitionStatus(order.id, order.status, status);
            if (!updated) return BadRequest("Order changed while you were updating it. Refresh and try again");

            if (["confirmed", "processing", "delivered"].includes(status)) {
                const items = await StoreOrderItemRepository.getByOrderId(order.id);
                const product = await StoreProductRepository.findById(order.product_id);
                const receipt = this.buildOrderEmailReceipt(updated, items as any[], product?.title || "Order");
                await MailService.sendOrderStatusEmail(receipt, status as "confirmed" | "processing" | "delivered");
            }

            return Ok(updated, "Order status updated");
        } catch (err: any) {
            return InternalError(err.message);
        }
    }

    static async updateBookingStatus(userId: number, bookingId: number, status: "confirmed" | "cancelled" | "expired") {
        try {
            const creator = await CreatorRepository.getOneWhere({ user_id: userId });
            if (!creator) return NotFound("Creator profile not found");

            const booking = await ServiceBookingRepository.findById(bookingId);
            if (!booking || booking.creator_id !== creator.id) return NotFound("Booking not found");

            if (booking.status === "confirmed" && status === "confirmed") {
                return Ok(booking, "Booking already confirmed");
            }

            const updated = await ServiceBookingRepository.update(booking.id, { status } as any);
            return Ok(updated, "Booking status updated");
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

            const orderItems = await StoreOrderItemRepository.getByOrderId(order.id);
            const hasDigitalItem = orderItems.some((item) => item.type_snapshot === "digital")
                || order.product?.type === "digital";
            let downloadToken: string | null = null;
            let downloadTokens: any[] = [];
            if (order.status === "paid" && hasDigitalItem) {
                downloadTokens = await StoreDownloadTokenRepository.getAllWhere({ order_id: order.id });
                if (downloadTokens.length === 0 && order.product?.type === "digital") {
                    const tokenRecord = await StoreDownloadTokenRepository.create({
                        order_id: order.id,
                        product_id: null,
                        token: this.generateDownloadToken(),
                        max_downloads: order.product?.download_limit || 3,
                    } as any);
                    downloadTokens = [tokenRecord];
                }
                downloadToken = downloadTokens[0]?.token || null;
            }

            let booking: any = null;
            if (order.product?.type === "service") {
                booking = await ServiceBookingRepository.getOneWhere({ order_id: order.id });
            }

            return Ok({
                order: {
                    ...order,
                    items: orderItems,
                },
                download_token: downloadToken,
                download_tokens: downloadTokens,
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
            if (!["paid", "confirmed", "processing", "shipped", "delivered"].includes(order.status)) {
                return BadRequest("Order is not paid");
            }

            const product = (order as any).product;
            const orderItems = await StoreOrderItemRepository.getByOrderId(order.id);
            const booking = await ServiceBookingRepository.getOneWhere({ order_id: order.id });
            const receipt = this.buildOrderEmailReceipt(order, orderItems as any[], product?.title || "Order");

            if (creator?.user?.email) {
                await MailService.sendCreatorOrderEmail(
                    creator.user.email,
                    creator.first_name || creator.username,
                    receipt,
                    booking
                        ? { start: booking.slot_start, end: booking.slot_end }
                        : null
                );
            }

            await MailService.sendOrderConfirmationEmail(receipt);

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
        const zonedDay = this.getZonedDateParts(day, window.timezone);
        const start = this.zonedLocalToUtc(
            window.timezone,
            zonedDay.year,
            zonedDay.month,
            zonedDay.day,
            startHour,
            startMin
        );
        const end = this.zonedLocalToUtc(
            window.timezone,
            zonedDay.year,
            zonedDay.month,
            zonedDay.day,
            endHour,
            endMin
        );

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
        await ServiceBookingRepository.expireHolds();
        const windows = await ServiceAvailabilityRepository.getByCreatorId(creatorId);
        const duration = service.duration_minutes || 30;
        const buffer = service.buffer_minutes || 0;

        const startDate = new Date(from);
        const endDate = new Date(to);
        const now = new Date();

        const bookings = await ServiceBookingRepository.getAllWhere({ service_id: service.id }, {}, (qb) => {
            qb.whereIn("status", ["hold", "confirmed"])
                .where("slot_start", "<", endDate.toISOString())
                .where("slot_end", ">", startDate.toISOString());
        });

        const bookedRanges = bookings.map((b: any) => ({
            start: new Date(b.slot_start),
            end: new Date(b.slot_end),
        }));

        const slots: Array<{ start: string; end: string }> = [];
        const seen = new Set<string>();
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            for (const window of windows) {
                if (!this.isValidTimezone(window.timezone)) continue;
                const zoned = this.getZonedDateParts(new Date(d), window.timezone);
                if (window.weekday !== zoned.weekday) continue;
                const daySlots = this.buildSlotsForDay(new Date(d), window, duration, buffer);
                for (const slot of daySlots) {
                    if (slot.start < now) continue;
                    if (slot.start < startDate || slot.end > endDate) continue;
                    const overlaps = bookedRanges.some((b) =>
                        slot.start < b.end && slot.end > b.start
                    );
                    if (!overlaps) {
                        const key = `${slot.start.toISOString()}_${slot.end.toISOString()}`;
                        if (seen.has(key)) continue;
                        seen.add(key);
                        slots.push({ start: slot.start.toISOString(), end: slot.end.toISOString() });
                    }
                }
            }
        }

        return slots;
    }

    static async getServiceSlots(username: string, serviceId: number, from: string, to: string) {
        try {
            await ServiceBookingRepository.expireHolds();
            if (!this.isValidDateInput(from) || !this.isValidDateInput(to)) {
                return BadRequest("Invalid date range");
            }
            const fromDate = new Date(from);
            const toDate = new Date(to);
            if (fromDate > toDate) {
                return BadRequest("Invalid date range: from must be before to");
            }
            const maxWindowMs = 31 * 24 * 60 * 60 * 1000;
            if (toDate.getTime() - fromDate.getTime() > maxWindowMs) {
                return BadRequest("Date range too large. Maximum allowed is 31 days");
            }
            const creator = await CreatorRepository.findByUsername(username);
            if (!creator) return NotFound("Creator not found");

            const service = await StoreProductRepository.findVisibleById(serviceId);
            if (!service || service.creator_id !== creator.id) return NotFound("Service not found");
            if (service.type !== "service") return BadRequest("Product is not a service");

            const slots = await this.computeAvailableSlots(creator.id, service, from, to);
            return Ok({ slots }, "Available slots retrieved");
        } catch (err: any) {
            return InternalError(err.message);
        }
    }

    static async listMyServiceSlots(userId: number, serviceId: number, from: string, to: string) {
        try {
            await ServiceBookingRepository.expireHolds();
            if (!this.isValidDateInput(from) || !this.isValidDateInput(to)) {
                return BadRequest("Invalid date range");
            }

            const creator = await CreatorRepository.getOneWhere({ user_id: userId });
            if (!creator) return NotFound("Creator profile not found");

            const service = await StoreProductRepository.findVisibleById(serviceId);
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
            const creator = await CreatorRepository.findByUsername(username);
            if (!creator) return NotFound("Creator not found");

            const service = await StoreProductRepository.findVisibleById(serviceId);
            if (!service || service.creator_id !== creator.id) return NotFound("Service not found");
            if (service.type !== "service") return BadRequest("Product is not a service");

            await ServiceBookingRepository.expireHolds();

            const holdExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
            const holdToken = this.generateHoldToken();

            const startDate = new Date(data.slot_start);
            if (Number.isNaN(startDate.getTime())) {
                return BadRequest("Invalid slot start");
            }
            if (startDate.getTime() <= Date.now()) {
                return BadRequest("Slot must be in the future");
            }
            const providedEnd = new Date(data.slot_end);
            if (Number.isNaN(providedEnd.getTime())) {
                return BadRequest("Invalid slot end");
            }
            if (startDate >= providedEnd) return BadRequest("Invalid slot selection");

            const configuredDuration = Number(service.duration_minutes) > 0 ? Number(service.duration_minutes) : null;
            const expectedEnd = configuredDuration
                ? new Date(startDate.getTime() + configuredDuration * 60000)
                : null;
            if (expectedEnd && Math.abs(providedEnd.getTime() - expectedEnd.getTime()) > 60000) {
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
                (slot) => slot.start === startDate.toISOString() && slot.end === providedEnd.toISOString()
            );

            if (!isValidSlot) {
                return BadRequest("Selected slot is not available");
            }

            const booking = await ServiceBookingRepository.create({
                service_id: service.id,
                creator_id: creator.id,
                slot_start: data.slot_start,
                slot_end: providedEnd.toISOString(),
                status: "hold",
                hold_expires_at: holdExpiresAt,
                hold_token: holdToken,
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

    static async blockServiceSlot(userId: number, data: BlockServiceSlotData) {
        try {
            const creator = await CreatorRepository.getOneWhere({ user_id: userId });
            if (!creator) return NotFound("Creator profile not found");

            const service = await StoreProductRepository.findVisibleById(data.service_id);
            if (!service || service.creator_id !== creator.id) return NotFound("Service not found");
            if (service.type !== "service") return BadRequest("Product is not a service");

            await ServiceBookingRepository.expireHolds();

            const startDate = new Date(data.slot_start);
            const endDate = new Date(data.slot_end);
            if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
                return BadRequest("Invalid slot range");
            }
            if (startDate >= endDate) return BadRequest("Invalid slot range");

            const configuredDuration = Number(service.duration_minutes) > 0 ? Number(service.duration_minutes) : null;
            const expectedEnd = configuredDuration
                ? new Date(startDate.getTime() + configuredDuration * 60000)
                : null;
            if (expectedEnd && Math.abs(endDate.getTime() - expectedEnd.getTime()) > 60000) {
                return BadRequest("Slot end time does not match service duration");
            }

            const overlaps = await ServiceBookingRepository.getAllWhere(
                { service_id: service.id },
                {},
                (qb) => {
                    qb.whereIn("status", ["hold", "confirmed"])
                        .where("slot_start", "<", endDate.toISOString())
                        .where("slot_end", ">", startDate.toISOString());
                }
            );
            if (overlaps.length > 0) {
                return BadRequest("Slot is no longer available");
            }

            const booking = await ServiceBookingRepository.create({
                service_id: service.id,
                creator_id: creator.id,
                slot_start: startDate.toISOString(),
                slot_end: endDate.toISOString(),
                status: "confirmed",
                notes: data.notes || "owner_block",
            } as any);

            return Ok(booking, "Time blocked successfully");
        } catch (err: any) {
            return InternalError(err.message);
        }
    }
}
