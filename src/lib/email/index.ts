/**
 * Email utilities - Main export file
 */

export { resend_config, FROM_EMAIL, ADMIN_EMAIL } from "../config/resend_config";
export { sendEnquiryNotification, sendEnquiryConfirmation } from "./enquiries";
export * from "./schemas";
export { default as EnquiryNotificationEmail } from "./EnquiryNotificationEmail";
export { default as EnquiryConfirmationEmail } from "./EnquiryConfirmationEmail";
