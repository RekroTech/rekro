/**
 * Application API Route Handler
 *
 * This file serves as the server-side API endpoint for handling rental applications.
 * It acts as the backend API layer between the frontend and the database.
 *
 * Architecture Flow:
 * Frontend (ApplicationForm) → React Query Hook (useSubmitApplication) →
 * This API Route → Supabase Database
 *
 * Note: This uses the server-side Supabase client for enhanced security and
 * server-level privileges. While there's some code similarity with
 * application.service.ts, this file handles server-side HTTP requests while
 * the service layer is designed for client-side operations.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { CreateApplicationRequest } from "@/types/application.types";

// Force dynamic for user-specific data
export const dynamic = "force-dynamic";

/**
 * POST /api/application
 *
 * Creates a new rental application.
 * This endpoint handles the complete application submission process including:
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
            status: "submitted" as const,
            message: message || null,
            submitted_at: applicationId ? undefined : new Date().toISOString(),
            move_in_date: moveInDate || null,
            rental_duration: rentalDuration ? parseInt(rentalDuration, 10) : null,
            proposed_rent: proposedRent ? parseFloat(proposedRent) : null,
            total_rent: totalRent || null,
            inclusions: inclusions || [],
            occupancy_type: occupancyType,
            updated_at: new Date().toISOString(),
        };

        // Upsert the application
        const { data: application, error: applicationError } = await supabase
            .from("applications")
            .upsert(applicationData, {
                onConflict: "id",
            })
            .select()
            .single();

        if (applicationError || !application) {
            console.error("Application upsert error:", applicationError);
            return NextResponse.json(
                { error: applicationError?.message || "Failed to save application" },
                { status: 500, headers: { "Cache-Control": "no-store" } }
            );
        }


        // Return the complete application
        return NextResponse.json(
            {
                success: true,
                data: application,
            },
            {
                status: applicationId ? 200 : 201,
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

/**
 * GET /api/application
 *
 * Fetch user's applications with optional filtering
 * Query params: status, propertyId, limit
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Check authentication
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

        // Parse query parameters
        const { searchParams } = request.nextUrl;
        const applicationId = searchParams.get("applicationId");
        const status = searchParams.get("status");
        const propertyId = searchParams.get("propertyId");
        const limit = parseInt(searchParams.get("limit") || "50", 10);

        // If applicationId is provided, fetch a single application
        if (applicationId) {
            const { data: application, error } = await supabase
                .from("applications")
                .select("*")
                .eq("id", applicationId)
                .eq("user_id", user.id)
                .single();

            if (error || !application) {
                return NextResponse.json(
                    { error: error?.message || "Application not found" },
                    { status: 404, headers: { "Cache-Control": "no-store" } }
                );
            }

            return NextResponse.json(
                { success: true, data: application },
                { headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=60" } }
            );
        }

        // Build query (list)
        let query = supabase
            .from("applications")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(limit);

        // Apply filters
        if (status) {
            query = query.eq("status", status);
        }
        if (propertyId) {
            query = query.eq("property_id", propertyId);
        }

        const { data: applications, error } = await query;

        if (error) {
            console.error("Error fetching applications:", error);
            return NextResponse.json(
                { error: error.message },
                { status: 500, headers: { "Cache-Control": "no-store" } }
            );
        }

        return NextResponse.json(
            {
                success: true,
                data: applications || [],
            },
            {
                headers: {
                    // Cache for 60 seconds, revalidate in background
                    "Cache-Control": "private, max-age=60, stale-while-revalidate=120",
                },
            }
        );
    } catch (error) {
        console.error("Error in GET /api/application:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500, headers: { "Cache-Control": "no-store" } }
        );
    }
}
