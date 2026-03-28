/**
 * Resend Email Client Configuration
 */

import { Resend } from "resend";
import { env } from "@/env";

if (!env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY environment variable is not set — email sending will be disabled");
}

export const resend_config = new Resend(env.RESEND_API_KEY ?? "");

// Default sender email - verified domain
export const FROM_EMAIL = env.RESEND_FROM_EMAIL || "admin@rekro.com.au";

// Admin notification recipient
export const ADMIN_EMAIL = "admin@rekro.com.au";

