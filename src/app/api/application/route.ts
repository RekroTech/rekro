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
import type { CreateApplicationRequest } from "@/types/application.types";

/**
 * POST /api/application
 *
 * Creates a new rental application with associated details.
 * This endpoint handles the complete application submission process including:
 * 1. User authentication verification
 * 2. Application record creation
 * 3. Application details creation
 * 4. Rollback on failure (transactional behavior)
 *
 * @param request - Contains: propertyId, unitId (optional), applicationType, formData
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
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Parse request body
        const body: CreateApplicationRequest = await request.json();
        const { propertyId, unitId, applicationType, formData } = body;

        // Validate required fields
        if (!propertyId || !applicationType || !formData) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Create the application
        const { data: application, error: applicationError } = await supabase
            .from("applications")
            .insert({
                user_id: user.id,
                property_id: propertyId,
                unit_id: unitId || null,
                application_type: applicationType,
                status: "submitted",
                message: formData.message || null,
                submitted_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (applicationError || !application) {
            console.error("Application creation error:", applicationError);
            return NextResponse.json(
                { error: applicationError?.message || "Failed to create application" },
                { status: 500 }
            );
        }

        // Create application details
        const { data: details, error: detailsError } = await supabase
            .from("application_details")
            .insert({
                application_id: application.id,
                move_in_date: formData.moveInDate || null,
                rental_duration: formData.rentalDuration || null,
                employment_status: formData.employmentStatus || null,
                income_source: formData.incomeSource || null,
                contact_phone: formData.phone || null,
                has_pets: formData.hasPets || false,
                smoker: formData.smoker || false,
                notes: formData.additionalInfo || null,
            })
            .select()
            .single();

        if (detailsError) {
            console.error("Application details creation error:", detailsError);
            // Rollback: delete the application if details creation fails
            await supabase.from("applications").delete().eq("id", application.id);
            return NextResponse.json(
                { error: detailsError?.message || "Failed to create application details" },
                { status: 500 }
            );
        }

        // Return the complete application with details
        return NextResponse.json(
            {
                success: true,
                data: {
                    ...application,
                    details,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Application submission error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// TODO: Add query params support for filtering applications (e.g., by status, property_id, date range)
export async function GET() {
    try {
        const supabase = await createClient();

        // Check authentication
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get user's applications
        const { data: applications, error } = await supabase
            .from("applications")
            .select(
                `
        *,
        details:application_details(*)
      `
            )
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching applications:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Format the response
        const formattedApplications = (applications || []).map((app) => ({
            ...app,
            details: Array.isArray(app.details) ? app.details[0] : app.details,
        }));

        return NextResponse.json({
            success: true,
            data: formattedApplications,
        });
    } catch (error) {
        console.error("Error in GET /api/application:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
