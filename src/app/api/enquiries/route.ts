/**
 * Enquiries API Route Handler
 *
 * POST /api/enquiries - Submit an enquiry (authenticated users or guests)
 */

import { NextRequest } from "next/server";
import { createClient, getSession } from "@/lib/supabase/server";
import { errorResponse, successResponse } from "@/app/api/utils";
import type { EnquiryInsert } from "@/types/db";

export const dynamic = "force-dynamic";

interface EnquiryRequestBody {
    unit_id: string;
    message: string;
    // Guest fields (required if not logged in)
    guest_name?: string;
    guest_email?: string;
    guest_phone?: string;
    // Honeypot field to catch bots
    website?: string;
}

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

        // Parse request body
        const body: EnquiryRequestBody = await request.json();
        const { unit_id, message, guest_name, guest_email, guest_phone, website } = body;

        // Honeypot check - if website field is filled, it's likely a bot
        if (website && website.trim().length > 0) {
            // Return success to fool the bot
            return successResponse({ ok: true, enquiry_id: "bot-detected" }, 201);
        }

        // Validate required fields
        if (!unit_id || !message) {
            return errorResponse("Missing required fields: unit_id and message are required", 400);
        }

        // Check if user is authenticated
        const user = await getSession();
        const isAuthenticated = !!user;

        // If guest, validate guest fields
        if (!isAuthenticated) {
            if (!guest_email || !guest_email.trim()) {
                return errorResponse("Guest email is required for unauthenticated enquiries", 400);
            }

            // Basic email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(guest_email)) {
                return errorResponse("Invalid email format", 400);
            }
        }

        // Verify unit exists and is active
        const { data: unit, error: unitError } = await supabase
            .from("units")
            .select("id, is_active, property_id")
            .eq("id", unit_id)
            .single();

        if (unitError || !unit) {
            return errorResponse("Unit not found", 404);
        }

        if (!unit.is_active) {
            return errorResponse("This unit is no longer available for enquiries", 400);
        }

        // Get client IP and user agent for tracking
        const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null;
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

        // Insert enquiry into database
        const { data: enquiry, error: insertError } = await supabase
            .from("enquiries")
            .insert(enquiryData)
            .select("id")
            .single();

        if (insertError) {
            console.error("Error inserting enquiry:", insertError);
            return errorResponse("Failed to submit enquiry", 500);
        }

        // TODO: Send notification emails
        // 1. Email to property landlord/agent
        // 2. Optional confirmation email to user/guest
        // This can be implemented using a service like Resend or SendGrid

        try {
            // Get property details for email notification
            const { data: property } = await supabase
                .from("properties")
                .select("title, landlord_id, created_by")
                .eq("id", unit.property_id)
                .single();

            if (property) {
                // Here you would send emails
                // Example:
                // await sendEnquiryNotification({
                //     enquiryId: enquiry.id,
                //     propertyTitle: property.title,
                //     landlordId: property.landlord_id,
                //     message,
                //     senderEmail: isAuthenticated ? user.email : guest_email,
                // });

                console.log("Enquiry notification would be sent for:", {
                    enquiryId: enquiry.id,
                    propertyTitle: property.title,
                    isAuthenticated,
                });
            }
        } catch (emailError) {
            // Log email error but don't fail the request
            console.error("Error sending enquiry notification:", emailError);
        }

        return successResponse(
            {
                ok: true,
                enquiry_id: enquiry.id,
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

