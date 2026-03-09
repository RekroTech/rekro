/**
 * Email templates for enquiries
 */

import type { EnquiryNotification, EnquiryConfirmation } from "./schemas";

/**
 * HTML template for landlord/agent notification email
 */
export function getEnquiryNotificationTemplate(data: EnquiryNotification): {
    subject: string;
    html: string;
    text: string;
} {
    const { propertyTitle, unitName, message, senderName, senderEmail, senderPhone, isAuthenticated } = data;

    const subject = `New Enquiry: ${propertyTitle}${unitName ? ` - ${unitName}` : ""}`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 32px 32px 24px 32px; border-bottom: 1px solid #e5e5e5;">
                            <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #1a1a1a;">
                                New Property Enquiry
                            </h1>
                            <p style="margin: 8px 0 0 0; font-size: 14px; color: #666;">
                                You have received a new enquiry from ${isAuthenticated ? "a registered user" : "a potential tenant"}
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Property Details -->
                    <tr>
                        <td style="padding: 24px 32px;">
                            <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #1a1a1a;">
                                Property Details
                            </h2>
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="padding: 8px 0;">
                                        <strong style="color: #666; font-size: 14px;">Property:</strong>
                                        <span style="color: #1a1a1a; font-size: 14px; margin-left: 8px;">${propertyTitle}</span>
                                    </td>
                                </tr>
                                ${unitName ? `
                                <tr>
                                    <td style="padding: 8px 0;">
                                        <strong style="color: #666; font-size: 14px;">Unit:</strong>
                                        <span style="color: #1a1a1a; font-size: 14px; margin-left: 8px;">${unitName}</span>
                                    </td>
                                </tr>
                                ` : ""}
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Contact Details -->
                    <tr>
                        <td style="padding: 0 32px 24px 32px;">
                            <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #1a1a1a;">
                                Contact Information
                            </h2>
                            <table width="100%" cellpadding="0" cellspacing="0">
                                ${senderName ? `
                                <tr>
                                    <td style="padding: 8px 0;">
                                        <strong style="color: #666; font-size: 14px;">Name:</strong>
                                        <span style="color: #1a1a1a; font-size: 14px; margin-left: 8px;">${senderName}</span>
                                    </td>
                                </tr>
                                ` : ""}
                                <tr>
                                    <td style="padding: 8px 0;">
                                        <strong style="color: #666; font-size: 14px;">Email:</strong>
                                        <a href="mailto:${senderEmail}" style="color: #0066cc; font-size: 14px; margin-left: 8px; text-decoration: none;">${senderEmail}</a>
                                    </td>
                                </tr>
                                ${senderPhone ? `
                                <tr>
                                    <td style="padding: 8px 0;">
                                        <strong style="color: #666; font-size: 14px;">Phone:</strong>
                                        <a href="tel:${senderPhone}" style="color: #0066cc; font-size: 14px; margin-left: 8px; text-decoration: none;">${senderPhone}</a>
                                    </td>
                                </tr>
                                ` : ""}
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Message -->
                    <tr>
                        <td style="padding: 0 32px 32px 32px;">
                            <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #1a1a1a;">
                                Message
                            </h2>
                            <div style="background-color: #f9f9f9; border-left: 4px solid #0066cc; padding: 16px; border-radius: 4px;">
                                <p style="margin: 0; font-size: 14px; color: #333; line-height: 1.6; white-space: pre-wrap;">${message}</p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- CTA Button -->
                    <tr>
                        <td style="padding: 0 32px 32px 32px; text-align: center;">
                            <a href="mailto:${senderEmail}" style="display: inline-block; background-color: #0066cc; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600;">
                                Reply to Enquiry
                            </a>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px 32px; background-color: #f9f9f9; border-top: 1px solid #e5e5e5; border-radius: 0 0 8px 8px;">
                            <p style="margin: 0; font-size: 12px; color: #666; text-align: center;">
                                This is an automated notification from reKro. Please do not reply to this email.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();

    const text = `
NEW PROPERTY ENQUIRY

Property Details:
- Property: ${propertyTitle}
${unitName ? `- Unit: ${unitName}` : ""}

Contact Information:
${senderName ? `- Name: ${senderName}` : ""}
- Email: ${senderEmail}
${senderPhone ? `- Phone: ${senderPhone}` : ""}

Message:
${message}

---
Reply to: ${senderEmail}
    `.trim();

    return { subject, html, text };
}

/**
 * HTML template for user confirmation email
 */
export function getEnquiryConfirmationTemplate(data: EnquiryConfirmation): {
    subject: string;
    html: string;
    text: string;
} {
    const { propertyTitle, unitName, message, recipientName } = data;

    const subject = `Your Enquiry for ${propertyTitle}${unitName ? ` - ${unitName}` : ""}`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 32px 32px 24px 32px; text-align: center; border-bottom: 1px solid #e5e5e5;">
                            <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #1a1a1a;">
                                Enquiry Received!
                            </h1>
                            <p style="margin: 12px 0 0 0; font-size: 14px; color: #666;">
                                ${recipientName ? `Hi ${recipientName},` : "Thank you for your enquiry!"}<br>
                                We've received your message and we will be in touch soon.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Success Icon -->
                    <tr>
                        <td style="padding: 24px 32px; text-align: center;">
                            <div style="display: inline-block; width: 64px; height: 64px; background-color: #10b981; border-radius: 50%; line-height: 64px; text-align: center;">
                                <span style="color: #ffffff; font-size: 32px;">✓</span>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Enquiry Summary -->
                    <tr>
                        <td style="padding: 0 32px 24px 32px;">
                            <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #1a1a1a; text-align: center;">
                                Enquiry Summary
                            </h2>
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9f9f9; border-radius: 6px; padding: 16px;">
                                <tr>
                                    <td style="padding: 8px 0;">
                                        <strong style="color: #666; font-size: 14px;">Property:</strong>
                                        <span style="color: #1a1a1a; font-size: 14px; margin-left: 8px;">${propertyTitle}</span>
                                    </td>
                                </tr>
                                ${unitName ? `
                                <tr>
                                    <td style="padding: 8px 0;">
                                        <strong style="color: #666; font-size: 14px;">Unit:</strong>
                                        <span style="color: #1a1a1a; font-size: 14px; margin-left: 8px;">${unitName}</span>
                                    </td>
                                </tr>
                                ` : ""}
                                <tr>
                                    <td style="padding: 16px 0 8px 0;">
                                        <strong style="color: #666; font-size: 14px;">Your Message:</strong>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 0;">
                                        <p style="margin: 0; font-size: 14px; color: #333; line-height: 1.6; white-space: pre-wrap;">${message}</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- What's Next -->
                    <tr>
                        <td style="padding: 0 32px 32px 32px;">
                            <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #1a1a1a;">
                                What happens next?
                            </h3>
                            <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #666; line-height: 1.8;">
                                <li>We will review your enquiry</li>
                                <li>We will contact you directly via email or phone</li>
                                <li>Response time is typically within 24-48 hours</li>
                            </ul>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px 32px; background-color: #f9f9f9; border-top: 1px solid #e5e5e5; border-radius: 0 0 8px 8px;">
                            <p style="margin: 0; font-size: 12px; color: #666; text-align: center;">
                                This is an automated confirmation from reKro.<br>
                                Please do not reply to this email.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();

    const text = `
ENQUIRY RECEIVED!

${recipientName ? `Hi ${recipientName},` : "Thank you for your enquiry!"}

We've received your message and we will be in touch soon.

Enquiry Summary:
- Property: ${propertyTitle}
${unitName ? `- Unit: ${unitName}` : ""}

Your Message:
${message}

What happens next?
- We will review your enquiry
- We will contact you directly via email or phone
- Response time is typically within 24-48 hours

---
This is an automated confirmation from reKro.
    `.trim();

    return { subject, html, text };
}

