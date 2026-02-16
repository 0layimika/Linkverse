import { z } from "zod";

const productTypeEnum = z.enum(["digital", "physical", "service"]);

export const createProductSchema = z.object({
    body: z.object({
        type: productTypeEnum,
        title: z.string({ message: "Title is required" }).min(1, "Title cannot be empty"),
        description: z.string().optional().nullable(),
        price: z.number({ message: "Price is required" }).min(100, "Minimum price is 100"),
        currency: z.string().optional(),
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
        price: z.number().min(100).optional(),
        currency: z.string().optional(),
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
    }),
});

export type updateProductSchema = z.infer<typeof updateProductSchema>;

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
        buyer_name: z.string().optional(),
        buyer_phone: z.string().optional(),
        delivery_address: z.record(z.string(), z.any()).optional().nullable(),
        slot_start: z.string().optional(),
        slot_end: z.string().optional(),
    }),
});

export type initiatePurchaseSchema = z.infer<typeof initiatePurchaseSchema>;

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
        start_time: z.string({ message: "Start time is required" }),
        end_time: z.string({ message: "End time is required" }),
        timezone: z.string({ message: "Timezone is required" }),
    }),
});

export type createAvailabilitySchema = z.infer<typeof createAvailabilitySchema>;

export const listSlotsSchema = z.object({
    params: z.object({
        username: z.string({ message: "Username is required" }),
        serviceId: z.string({ message: "Service ID is required" }),
    }),
    query: z.object({
        from: z.string({ message: "From date is required" }),
        to: z.string({ message: "To date is required" }),
    }),
});

export type listSlotsSchema = z.infer<typeof listSlotsSchema>;

export const holdSlotSchema = z.object({
    params: z.object({
        username: z.string({ message: "Username is required" }),
        serviceId: z.string({ message: "Service ID is required" }),
    }),
    body: z.object({
        slot_start: z.string({ message: "Slot start is required" }),
        slot_end: z.string({ message: "Slot end is required" }),
        buyer_email: z.string().email().optional(),
        buyer_name: z.string().optional(),
        buyer_phone: z.string().optional(),
        notes: z.string().optional(),
    }),
});

export type holdSlotSchema = z.infer<typeof holdSlotSchema>;
