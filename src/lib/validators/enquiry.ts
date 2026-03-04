import { z } from "zod";

/**
 * Enquiry validation schemas
 * Used for runtime validation of API inputs/outputs
 */

// Enquiry request body schema
export const EnquiryRequestSchema = z.object({
    unit_id: z.string().uuid("Invalid unit ID"),
    message: z.string().min(10, "Message must be at least 10 characters").max(2000, "Message is too long"),
    // Guest fields (required if not logged in)
    guest_name: z.string().min(1).max(100).optional(),
    guest_email: z.string().email("Invalid email format").optional(),
    guest_phone: z.string().max(20).optional(),
    // Honeypot field to catch bots
    website: z.string().optional(),
});

// Enquiry database schema
export const EnquirySchema = z.object({
    id: z.string().uuid(),
    unit_id: z.string().uuid(),
    user_id: z.string().uuid().nullable(),
    message: z.string(),
    guest_name: z.string().nullable().optional(),
    guest_email: z.string().email().nullable().optional(),
    guest_phone: z.string().nullable().optional(),
    contact_name: z.string().nullable().optional(),
    contact_email: z.string().email().nullable().optional(),
    contact_phone: z.string().nullable().optional(),
    ip: z.string().nullable().optional(),
    user_agent: z.string().nullable().optional(),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
});

// Enquiry insert schema
export const EnquiryInsertSchema = EnquirySchema.omit({
    id: true,
    created_at: true,
    updated_at: true,
});

// Type exports
export type EnquiryRequest = z.infer<typeof EnquiryRequestSchema>;
export type Enquiry = z.infer<typeof EnquirySchema>;
export type EnquiryInsert = z.infer<typeof EnquiryInsertSchema>;

