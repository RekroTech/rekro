/**
 * Application API Route Handler
 *
 * Server-side API endpoint for managing rental applications.
 * Following Next.js App Router best practices.
 *
 * Endpoints:
 * - POST /api/application - Create or update an application
 *
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { CreateApplicationRequest } from "@/types/application.types";
import { parseInclusions } from "@/lib/utils/inclusions";

export const dynamic = "force-dynamic";

/**
 * POST /api/application
 *
 * Creates or updates a rental application.
 * Handles the complete application submission process including:
 * 1. User authentication verification
 * 2. Application record creation/update
 *
 * @param request - Contains: applicationId (optional), propertyId, unitId (optional), applicationType,
 *                  moveInDate, rentalDuration, proposedRent, totalRent, inclusions, isDualOccupancy, message
 * @returns 201 with application data on success, error response on failure
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Check authentication - only authenticated users can submit applications
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401, headers: { "Cache-Control": "no-store" } }
            );
        }

        // Parse request body
        const body: CreateApplicationRequest = await request.json();
        const {
            applicationId,
            propertyId,
            unitId,
            applicationType,
            moveInDate,
            rentalDuration,
            proposedRent,
            totalRent,
            inclusions,
            occupancyType,
            message,
        } = body;

        // Validate required fields
        if (!propertyId || !applicationType) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400, headers: { "Cache-Control": "no-store" } }
            );
        }

        // Validate inclusions shape (canonical object)
        let parsedInclusions;
        try {
            parsedInclusions = parseInclusions(inclusions, { mode: "strict" });
        } catch (e) {
            return NextResponse.json(
                { error: e instanceof Error ? e.message : "Invalid inclusions" },
                { status: 400, headers: { "Cache-Control": "no-store" } }
            );
        }

        // If updating, verify the application belongs to the user
        if (applicationId) {
            const { data: existingApp, error: checkError } = await supabase
                .from("applications")
                .select("user_id")
                .eq("id", applicationId)
                .single();

            if (checkError || !existingApp) {
                return NextResponse.json(
                    { error: "Application not found" },
                    { status: 404, headers: { "Cache-Control": "no-store" } }
                );
            }

            if (existingApp.user_id !== user.id) {
                return NextResponse.json(
                    { error: "Unauthorized to update this application" },
                    { status: 403, headers: { "Cache-Control": "no-store" } }
                );
            }
        }

        // Prepare application data
        const applicationData = {
            ...(applicationId ? { id: applicationId } : {}),
            user_id: user.id,
            property_id: propertyId,
            unit_id: unitId || null,
            application_type: applicationType,
            status: "draft" as const,
            message: message || null,
            submitted_at: applicationId ? undefined : new Date().toISOString(),
            move_in_date: moveInDate || null,
            rental_duration: rentalDuration ? parseInt(rentalDuration, 10) : null,
            proposed_rent: proposedRent ? parseFloat(proposedRent) : null,
            total_rent: totalRent || null,
            inclusions: parsedInclusions,
            occupancy_type: occupancyType,
            updated_at: new Date().toISOString(),
        };

        // Upsert the application
        const { error: applicationError } = await supabase
            .from("applications")
            .upsert(applicationData, {
                onConflict: "id",
            });

        if (applicationError) {
            console.error("Application upsert error:", {
                message: applicationError.message,
                code: (applicationError as any).code,
                details: (applicationError as any).details,
                hint: (applicationError as any).hint,
            });
            return NextResponse.json(
                { error: applicationError.message || "Failed to save application" },
                { status: 500, headers: { "Cache-Control": "no-store" } }
            );
        }

        // Fetch the application after upsert (kept separate to isolate DB/RLS issues)
        const idToFetch = applicationId;
        if (!idToFetch) {
            // In case of create without explicit id, fetch the most recent submitted app for this user/property/unit.
            // This matches the typical UX flow and avoids depending on RETURNING *.
            const { data: created, error: fetchCreatedError } = await supabase
                .from("applications")
                .select("*")
                .eq("user_id", user.id)
                .eq("property_id", propertyId)
                .eq("unit_id", unitId || null)
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle();

            if (fetchCreatedError) {
                console.error("Application fetch-after-create error:", fetchCreatedError);
                return NextResponse.json(
                    { success: true, data: null },
                    {
                        status: 201,
                        headers: {
                            "Cache-Control": "no-store",
                        },
                    }
                );
            }

            return NextResponse.json(
                {
                    success: true,
                    data: created,
                },
                {
                    status: 201,
                    headers: {
                        "Cache-Control": "no-store",
                    },
                }
            );
        }

        const { data: application, error: fetchError } = await supabase
            .from("applications")
            .select("*")
            .eq("id", idToFetch)
            .single();

        if (fetchError || !application) {
            console.error("Application fetch-after-upsert error:", fetchError);
            // Upsert succeeded; return success without payload to avoid blocking UX
            return NextResponse.json(
                { success: true, data: null },
                {
                    status: 200,
                    headers: {
                        "Cache-Control": "no-store",
                    },
                }
            );
        }

        // Return the complete application
        return NextResponse.json(
            {
                success: true,
                data: application,
            },
            {
                status: 200,
                headers: {
                    "Cache-Control": "no-store",
                },
            }
        );
    } catch (error) {
        console.error("Application submission error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500, headers: { "Cache-Control": "no-store" } }
        );
    }
}
