/**
 * Enquiries API Route Handler
 *
 * POST /api/enquiries - Submit an enquiry (authenticated users or guests)
 *                       Sends a notification email to admin@rekro.com.au
 *                       and a confirmation email to the enquirer.
 */

import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { errorResponse, successResponse } from "@/app/api/utils";
import { sendEnquiryConfirmation, sendEnquiryNotification, ADMIN_EMAIL } from "@/lib/email";
import type { EnquiryInsert } from "@/types/db";
import { EnquiryRequestSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";


/**
 * POST /api/enquiries
 *
 * Creates a new enquiry for a unit.
 * Supports both authenticated users and guest submissions.
 *
 * @param request - Contains: unit_id, message, and optionally guest fields
 * @returns 201 with enquiry_id on success, error response on failure
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin || "http://localhost:3000";

        // Parse and validate request body
        const rawBody = await request.json();

        let body;
        try {
            body = EnquiryRequestSchema.parse(rawBody);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Invalid request data";
            return errorResponse(`Validation error: ${message}`, 400);
        }

        const { unit_id, message, guest_name, guest_email, guest_phone, website } = body;

        // Honeypot check - if website field is filled, it's likely a bot
        if (website && website.trim().length > 0) {
            // Return success to fool the bot
            return successResponse({ ok: true, enquiry_id: "bot-detected" }, 201);
        }

        // Check if user is authenticated.
        // NOTE: Other routes use requireAuthForApi() which internally calls getSession() with
        // React cache() — that only works in Server Components, not API routes. For optional
        // auth (guests allowed), call auth.getUser() directly on the already-created client.
        const { data: { user } } = await supabase.auth.getUser();
        const isAuthenticated = !!user;

        // If guest, validate guest fields (Zod already did basic validation)
        if (!isAuthenticated) {
            if (!guest_email || !guest_email.trim()) {
                return errorResponse("Guest email is required for unauthenticated enquiries", 400);
            }
        }

        // Verify unit exists and is active
        const { data: unit, error: unitError } = await supabase
            .from("units")
            .select("id, status, property_id")
            .eq("id", unit_id)
            .single();

        if (unitError || !unit) {
            return errorResponse("Unit not found", 404);
        }

        if (unit.status !== "active") {
            return errorResponse("This unit is no longer available for enquiries", 400);
        }

        // Get client IP and user agent for tracking
        // x-forwarded-for can be a comma-separated list; take only the first (client) IP
        const rawIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null;
        const ip = rawIp ? (rawIp.split(",")[0]?.trim() ?? null) : null;
        const userAgent = request.headers.get("user-agent") || null;

        // Prepare enquiry data
        const enquiryData: EnquiryInsert = {
            unit_id,
            message: message.trim(),
            user_id: isAuthenticated ? user.id : null,
            ip,
            user_agent: userAgent,
        };

        // Add guest fields if not authenticated
        if (!isAuthenticated) {
            enquiryData.guest_name = guest_name?.trim() || null;
            enquiryData.guest_email = guest_email!.trim(); // Safe: validated above
            enquiryData.guest_phone = guest_phone?.trim() || null;
        } else {
            // For authenticated users, snapshot their current contact info
            const { data: userProfile } = await supabase
                .from("users")
                .select("full_name, email, phone")
                .eq("id", user.id)
                .single();

            if (userProfile) {
                enquiryData.contact_name = userProfile.full_name;
                enquiryData.contact_email = userProfile.email;
                enquiryData.contact_phone = userProfile.phone;
            }
        }

        // Generate ID client-side so we can return it without needing a SELECT after insert
        // (RLS does not grant SELECT on enquiries for anon/guest callers)
        const enquiryId = crypto.randomUUID();
        enquiryData.id = enquiryId;

        // Insert enquiry into database
        const { error: insertError } = await supabase
            .from("enquiries")
            .insert(enquiryData);

        if (insertError) {
            console.error("Error inserting enquiry:", insertError);
            return errorResponse("Failed to submit enquiry", 500);
        }

        // Send confirmation email to enquirer
        try {
            const { data: property } = await supabase
                .from("properties")
                .select("title, address")
                .eq("id", unit.property_id)
                .single();

            if (property) {
                const { data: unitDetails } = await supabase
                    .from("units")
                    .select("unit_number, floor_level")
                    .eq("id", unit_id)
                    .single();

                const unitName = unitDetails?.unit_number ||
                    (unitDetails?.floor_level ? `Floor ${unitDetails.floor_level}` : undefined);

                // Build a human-readable address string from the JSONB address field
                const addr = property.address as { street?: string; suburb?: string; city?: string; state?: string; postcode?: string } | null;
                const propertyAddress = addr
                    ? [addr.street, addr.suburb ?? addr.city, addr.state, addr.postcode]
                        .filter(Boolean)
                        .join(", ")
                    : undefined;

                const enquirerEmail = isAuthenticated
                    ? enquiryData.contact_email!
                    : enquiryData.guest_email!;
                const enquirerName = isAuthenticated
                    ? enquiryData.contact_name || undefined
                    : enquiryData.guest_name || undefined;

                const shouldSendEmails = process.env.SEND_ENQUIRY_CONFIRMATION !== "false";
                const propertyUrl = new URL(`/property/${unit.property_id}?unit=${unit_id}`, baseUrl).toString();

                if (shouldSendEmails) {
                    // Send admin notification to admin@rekro.com.au
                    try {
                        await sendEnquiryNotification({
                            enquiryId,
                            propertyTitle: property.title,
                            propertyAddress,
                            propertyUrl,
                            unitName,
                            message,
                            senderName: enquirerName,
                            senderEmail: enquirerEmail,
                            senderPhone: isAuthenticated
                                ? enquiryData.contact_phone ?? undefined
                                : enquiryData.guest_phone ?? undefined,
                            recipientEmail: ADMIN_EMAIL,
                            isAuthenticated,
                        });
                        console.log("Enquiry notification sent to admin:", ADMIN_EMAIL);
                    } catch (notificationError) {
                        console.error("Error sending enquiry notification to admin:", notificationError);
                    }

                    // Send confirmation email to the enquirer
                    try {
                        await sendEnquiryConfirmation({
                            enquiryId,
                            propertyTitle: property.title,
                            propertyAddress,
                            propertyUrl,
                            unitName,
                            message,
                            recipientEmail: enquirerEmail,
                            recipientName: enquirerName,
                        });
                        console.log("Enquiry confirmation sent to:", enquirerEmail);
                    } catch (confirmationError) {
                        console.error("Error sending enquiry confirmation:", confirmationError);
                    }
                }
            }
        } catch (emailError) {
            // Log email error but don't fail the request
            console.error("Error in email confirmation process:", emailError);
        }

        return successResponse(
            {
                ok: true,
                enquiry_id: enquiryId,
            },
            201
        );
    } catch (error) {
        console.error("Error in POST /api/enquiries:", error);

        if (error instanceof Error && error.message === "Unauthorized") {
            return errorResponse("Unauthorized", 401);
        }

        return errorResponse("Internal server error", 500);
    }
}
