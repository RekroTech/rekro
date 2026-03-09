/**
 * Email sending functions for enquiries
 */

import { render } from "@react-email/render";
import { resend, FROM_EMAIL } from "./resend";
import EnquiryNotificationEmail from "./EnquiryNotificationEmail";
import EnquiryConfirmationEmail from "./EnquiryConfirmationEmail";
import {
    enquiryNotificationSchema,
    enquiryConfirmationSchema,
    type EnquiryNotification,
    type EnquiryConfirmation,
} from "./schemas";

/**
 * Send enquiry notification email to admin
 */
export async function sendEnquiryNotification(data: EnquiryNotification) {
    if (!process.env.RESEND_API_KEY) {
        console.warn("Skipping enquiry notification email — RESEND_API_KEY is not set");
        return null;
    }

    const validatedData = enquiryNotificationSchema.parse(data);
    const { propertyTitle, unitName } = validatedData;

    const subject = `New Enquiry: ${propertyTitle}${unitName ? ` - ${unitName}` : ""}`;
    const html = await render(EnquiryNotificationEmail(validatedData));
    const text = await render(EnquiryNotificationEmail(validatedData), { plainText: true });

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

    const validatedData = enquiryConfirmationSchema.parse(data);
    const { propertyTitle, unitName } = validatedData;

    const subject = `Your Enquiry for ${propertyTitle}${unitName ? ` - ${unitName}` : ""}`;
    const html = await render(EnquiryConfirmationEmail(validatedData));
    const text = await render(EnquiryConfirmationEmail(validatedData), { plainText: true });

    return await resend.emails.send({
        from: FROM_EMAIL,
        to: validatedData.recipientEmail,
        subject,
        html,
        text,
    });
}
