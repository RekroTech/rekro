/**
 * Email validation schemas using Zod
 */

import { z } from "zod";

export const enquiryNotificationSchema = z.object({
    enquiryId: z.string().uuid(),
    propertyTitle: z.string(),
    unitName: z.string().optional(),
    listingType: z.string().optional(),
    message: z.string(),
    senderName: z.string().optional(),
    senderEmail: z.string().email(),
    senderPhone: z.string().optional(),
    recipientEmail: z.string().email(),
    recipientName: z.string().optional(),
    isAuthenticated: z.boolean(),
});

export const enquiryConfirmationSchema = z.object({
    enquiryId: z.string().uuid(),
    propertyTitle: z.string(),
    unitName: z.string().optional(),
    listingType: z.string().optional(),
    message: z.string(),
    recipientEmail: z.string().email(),
    recipientName: z.string().optional(),
});

export type EnquiryNotification = z.infer<typeof enquiryNotificationSchema>;
export type EnquiryConfirmation = z.infer<typeof enquiryConfirmationSchema>;

