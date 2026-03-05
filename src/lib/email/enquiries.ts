/**
 * Email sending functions for enquiries
 */

import { resend, FROM_EMAIL } from "./resend";
import { getEnquiryNotificationTemplate, getEnquiryConfirmationTemplate } from "./templates";
import {
    enquiryNotificationSchema,
    enquiryConfirmationSchema,
    type EnquiryNotification,
    type EnquiryConfirmation,
} from "./schemas";

/**
 * Send enquiry notification email to property owner/landlord
 */
export async function sendEnquiryNotification(data: EnquiryNotification) {
    if (!process.env.RESEND_API_KEY) {
        console.warn("Skipping enquiry notification email — RESEND_API_KEY is not set");
        return null;
    }

    // Validate input
    const validatedData = enquiryNotificationSchema.parse(data);

    const { subject, html, text } = getEnquiryNotificationTemplate(validatedData);

    return await resend.emails.send({
        from: FROM_EMAIL,
        to: validatedData.recipientEmail,
        subject,
        html,
        text,
        replyTo: validatedData.senderEmail,
    });
}

/**
 * Send confirmation email to the person who submitted the enquiry
 */
export async function sendEnquiryConfirmation(data: EnquiryConfirmation) {
    if (!process.env.RESEND_API_KEY) {
        console.warn("Skipping enquiry confirmation email — RESEND_API_KEY is not set");
        return null;
    }

    // Validate input
    const validatedData = enquiryConfirmationSchema.parse(data);

    const { subject, html, text } = getEnquiryConfirmationTemplate(validatedData);

    return await resend.emails.send({
        from: FROM_EMAIL,
        to: validatedData.recipientEmail,
        subject,
        html,
        text,
    });
}

