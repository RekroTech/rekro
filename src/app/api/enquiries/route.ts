/**
 * Enquiries API Route Handler
 *
 * POST /api/enquiries - Submit an enquiry (authenticated users or guests)
 */

import { NextRequest } from "next/server";
import { createClient, getSession } from "@/lib/supabase/server";
import { errorResponse, successResponse } from "@/app/api/utils";
import { sendEnquiryNotification, sendEnquiryConfirmation } from "@/lib/email";
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

        // Check if user is authenticated
        const user = await getSession();
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

        // Send notification emails
        // 1. Email to property creator/agent
        // 2. Optional confirmation email to user/guest

        try {
            // Get property details and creator information for email notification
            const { data: property } = await supabase
                .from("properties")
                .select(`
                    title,
                    created_by,
                    users!properties_created_by_fkey (
                        email,
                        full_name
                    )
                `)
                .eq("id", unit.property_id)
                .single();

            if (property) {
                // Get unit details for email
                const { data: unitDetails } = await supabase
                    .from("units")
                    .select("unit_number, floor_level")
                    .eq("id", unit_id)
                    .single();

                const unitName = unitDetails?.unit_number ||
                    (unitDetails?.floor_level ? `Floor ${unitDetails.floor_level}` : undefined);

                // Get property creator's information
                const creatorData = Array.isArray(property.users)
                    ? property.users[0]
                    : property.users;

                const recipientEmail = creatorData?.email;
                const recipientName = creatorData?.full_name;

                if (recipientEmail) {
                    // 1. Send notification to property creator
                    try {
                        await sendEnquiryNotification({
                            enquiryId: enquiry.id,
                            propertyTitle: property.title,
                            unitName,
                            message,
                            senderName: isAuthenticated
                                ? enquiryData.contact_name || undefined
                                : enquiryData.guest_name || undefined,
                            senderEmail: isAuthenticated
                                ? enquiryData.contact_email!
                                : enquiryData.guest_email!,
                            senderPhone: isAuthenticated
                                ? enquiryData.contact_phone || undefined
                                : enquiryData.guest_phone || undefined,
                            recipientEmail,
                            recipientName: recipientName || undefined,
                            isAuthenticated,
                        });

                        console.log("Enquiry notification sent to:", recipientEmail);
                    } catch (notificationError) {
                        console.error("Error sending enquiry notification:", notificationError);
                        // Don't fail the request if notification fails
                    }

                    // 2. Send confirmation to enquirer (optional, configurable)
                    const shouldSendConfirmation = process.env.SEND_ENQUIRY_CONFIRMATION !== "false";

                    if (shouldSendConfirmation) {
                        try {
                            await sendEnquiryConfirmation({
                                enquiryId: enquiry.id,
                                propertyTitle: property.title,
                                unitName,
                                message,
                                recipientEmail: isAuthenticated
                                    ? enquiryData.contact_email!
                                    : enquiryData.guest_email!,
                                recipientName: isAuthenticated
                                    ? enquiryData.contact_name || undefined
                                    : enquiryData.guest_name || undefined,
                            });

                            console.log("Enquiry confirmation sent to:",
                                isAuthenticated ? enquiryData.contact_email : enquiryData.guest_email
                            );
                        } catch (confirmationError) {
                            console.error("Error sending enquiry confirmation:", confirmationError);
                            // Don't fail the request if confirmation fails
                        }
                    }
                } else {
                    console.warn("No recipient email found for property:", property.title);
                }
            }
        } catch (emailError) {
            // Log email error but don't fail the request
            console.error("Error in email notification process:", emailError);
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

