import { z } from "zod";

export const storeCurrencySchema = z.object({ body: z.object({ currency: z.enum(["NGN", "USD"]) }) });
export type storeCurrencySchema = z.infer<typeof storeCurrencySchema>;

const productTypeEnum = z.enum(["digital", "physical", "service"]);
const timeString = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)");

export const createProductSchema = z.object({
    body: z.object({
        type: productTypeEnum,
        title: z.string({ message: "Title is required" }).min(1, "Title cannot be empty"),
        description: z.string().optional().nullable(),
        price: z.coerce.number({ message: "Price is required" }).positive(),
        compare_at_price: z.coerce.number().positive().optional().nullable(),
        currency: z.enum(["NGN", "USD"]).optional(),
        cover_url: z.string().url("Invalid cover URL").optional().nullable(),
        is_active: z.boolean().optional(),
        download_limit: z.number().int().min(1).optional(),
        file_id: z.string().optional().nullable(),
        file_url: z.string().url("Invalid file URL").optional().nullable(),
        file_size: z.number().optional().nullable(),
        file_type: z.string().optional().nullable(),
        duration_minutes: z.number().int().positive().optional().nullable(),
        buffer_minutes: z.number().int().min(0).optional().nullable(),
        timezone: z.string().optional().nullable(),
        requires_address: z.boolean().optional(),
        track_inventory: z.boolean().optional(),
        stock_quantity: z.coerce.number().int().min(0).optional().nullable(),
    }).superRefine((body, ctx) => {
        const minimum = body.currency === "USD" ? 1 : 1000;
        if (body.price < minimum) ctx.addIssue({ code: z.ZodIssueCode.too_small, minimum, inclusive: true, origin: "number", path: ["price"], message: `Minimum price is ${body.currency === "USD" ? "$1" : "₦1,000"}` });
    }),
});

export type createProductSchema = z.infer<typeof createProductSchema>;

export const updateProductSchema = z.object({
    params: z.object({
        id: z.string({ message: "Product ID is required" }),
    }),
    body: z.object({
        title: z.string().min(1, "Title cannot be empty").optional(),
        description: z.string().optional().nullable(),
        price: z.coerce.number().positive().optional(),
        compare_at_price: z.coerce.number().positive().optional().nullable(),
        currency: z.enum(["NGN", "USD"]).optional(),
        cover_url: z.string().url("Invalid cover URL").optional().nullable(),
        is_active: z.boolean().optional(),
        download_limit: z.number().int().min(1).optional(),
        file_id: z.string().optional().nullable(),
        file_url: z.string().url("Invalid file URL").optional().nullable(),
        file_size: z.number().optional().nullable(),
        file_type: z.string().optional().nullable(),
        duration_minutes: z.number().int().positive().optional().nullable(),
        buffer_minutes: z.number().int().min(0).optional().nullable(),
        timezone: z.string().optional().nullable(),
        requires_address: z.boolean().optional(),
        track_inventory: z.boolean().optional(),
        stock_quantity: z.coerce.number().int().min(0).optional().nullable(),
    }),
});

export type updateProductSchema = z.infer<typeof updateProductSchema>;

export const deleteProductSchema = z.object({
    params: z.object({
        id: z.string({ message: "Product ID is required" }),
    }),
});

export type deleteProductSchema = z.infer<typeof deleteProductSchema>;

export const paginationSchema = z.object({
    query: z.object({
        limit: z.string().regex(/^\d+$/, "Limit must be a number").optional(),
        offset: z.string().regex(/^\d+$/, "Offset must be a number").optional(),
    }),
});

export type paginationSchema = z.infer<typeof paginationSchema>;

export const getStorefrontSchema = z.object({
    params: z.object({
        username: z.string({ message: "Username is required" }),
    }),
    query: z.object({
        limit: z.string().regex(/^\d+$/, "Limit must be a number").optional(),
        offset: z.string().regex(/^\d+$/, "Offset must be a number").optional(),
    }).optional(),
});

export type getStorefrontSchema = z.infer<typeof getStorefrontSchema>;

export const initiatePurchaseSchema = z.object({
    params: z.object({
        username: z.string({ message: "Username is required" }),
        productId: z.string({ message: "Product ID is required" }),
    }),
    body: z.object({
        buyer_email: z.string().email("Invalid email"),
        buyer_name: z.string().min(2, "Name is required"),
        buyer_phone: z.string().min(7, "Phone is required"),
        delivery_address: z.record(z.string(), z.any()).optional().nullable(),
        hold_booking_id: z.number().int().positive().optional(),
        hold_token: z.string().min(8).optional(),
        slot_start: z.string().datetime({ offset: true }).optional(),
        slot_end: z.string().datetime({ offset: true }).optional(),
    }),
});

export type initiatePurchaseSchema = z.infer<typeof initiatePurchaseSchema>;

export const cartCheckoutSchema = z.object({
    params: z.object({
        username: z.string({ message: "Username is required" }),
    }),
    body: z.object({
        buyer_email: z.string().email("Invalid email"),
        buyer_name: z.string().min(2, "Name is required"),
        buyer_phone: z.string().min(7, "Phone is required"),
        delivery_address: z.record(z.string(), z.any()).optional().nullable(),
        items: z.array(
            z.object({
                product_id: z.number().int().positive(),
                quantity: z.number().int().min(1).max(100),
            })
        ).min(1, "Cart cannot be empty"),
    }),
});

export type cartCheckoutSchema = z.infer<typeof cartCheckoutSchema>;

export const verifyPurchaseSchema = z.object({
    query: z.object({
        reference: z.string({ message: "Reference is required" }),
    }),
});

export type verifyPurchaseSchema = z.infer<typeof verifyPurchaseSchema>;

export const getOrderSchema = z.object({
    query: z.object({
        reference: z.string({ message: "Reference is required" }),
    }),
});

export type getOrderSchema = z.infer<typeof getOrderSchema>;

export const resendOrderEmailSchema = z.object({
    params: z.object({
        id: z.string({ message: "Order ID is required" }),
    }),
});

export type resendOrderEmailSchema = z.infer<typeof resendOrderEmailSchema>;

export const downloadSchema = z.object({
    params: z.object({
        token: z.string({ message: "Token is required" }),
    }),
});

export type downloadSchema = z.infer<typeof downloadSchema>;

export const createAvailabilitySchema = z.object({
    body: z.object({
        weekday: z.number().int().min(0).max(6),
        start_time: timeString,
        end_time: timeString,
        timezone: z.string({ message: "Timezone is required" }),
    }).refine((value) => value.start_time < value.end_time, {
        message: "End time must be after start time",
        path: ["end_time"],
    }),
});

export type createAvailabilitySchema = z.infer<typeof createAvailabilitySchema>;

export const updateAvailabilitySchema = z.object({
    params: z.object({
        id: z.string({ message: "Availability ID is required" }),
    }),
    body: z.object({
        weekday: z.number().int().min(0).max(6).optional(),
        start_time: timeString.optional(),
        end_time: timeString.optional(),
        timezone: z.string().optional(),
    }),
});

export type updateAvailabilitySchema = z.infer<typeof updateAvailabilitySchema>;

export const deleteAvailabilitySchema = z.object({
    params: z.object({
        id: z.string({ message: "Availability ID is required" }),
    }),
});

export type deleteAvailabilitySchema = z.infer<typeof deleteAvailabilitySchema>;

export const listSlotsSchema = z.object({
    params: z.object({
        username: z.string({ message: "Username is required" }),
        serviceId: z.string({ message: "Service ID is required" }),
    }),
    query: z.object({
        from: z.string({ message: "From date is required" }).datetime({ offset: true }),
        to: z.string({ message: "To date is required" }).datetime({ offset: true }),
    }),
});

export type listSlotsSchema = z.infer<typeof listSlotsSchema>;

export const holdSlotSchema = z.object({
    params: z.object({
        username: z.string({ message: "Username is required" }),
        serviceId: z.string({ message: "Service ID is required" }),
    }),
    body: z.object({
        slot_start: z.string({ message: "Slot start is required" }).datetime({ offset: true }),
        slot_end: z.string({ message: "Slot end is required" }).datetime({ offset: true }),
        buyer_email: z.string().email().optional(),
        buyer_name: z.string().optional(),
        buyer_phone: z.string().optional(),
        notes: z.string().optional(),
    }),
});

export type holdSlotSchema = z.infer<typeof holdSlotSchema>;

export const ownerListSlotsSchema = z.object({
    params: z.object({
        serviceId: z.string({ message: "Service ID is required" }),
    }),
    query: z.object({
        from: z.string({ message: "From date is required" }).datetime({ offset: true }),
        to: z.string({ message: "To date is required" }).datetime({ offset: true }),
    }),
});

export type ownerListSlotsSchema = z.infer<typeof ownerListSlotsSchema>;

export const blockSlotSchema = z.object({
    body: z.object({
        service_id: z.number().int().positive(),
        slot_start: z.string().datetime({ offset: true }),
        slot_end: z.string().datetime({ offset: true }),
        notes: z.string().optional(),
    }),
});

export type blockSlotSchema = z.infer<typeof blockSlotSchema>;

export const updateOrderStatusSchema = z.object({
    params: z.object({
        id: z.string({ message: "Order ID is required" }),
    }),
    body: z.object({
        status: z.enum(["confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"]),
    }),
});

export type updateOrderStatusSchema = z.infer<typeof updateOrderStatusSchema>;

export const updateBookingStatusSchema = z.object({
    params: z.object({
        id: z.string({ message: "Booking ID is required" }),
    }),
    body: z.object({
        status: z.enum(["confirmed", "cancelled", "expired"]),
    }),
});

export type updateBookingStatusSchema = z.infer<typeof updateBookingStatusSchema>;
