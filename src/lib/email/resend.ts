/**
 * Resend Email Client Configuration
 */

import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY environment variable is not set — email sending will be disabled");
}

export const resend = new Resend(process.env.RESEND_API_KEY ?? "");

// Default sender email - update this to your verified domain
export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

