/**
 * Application Submit API Route Handler
 *
 * Server-side API endpoint for submitting rental applications.
 * Updates application status to "submitted" and sets submitted_at timestamp.
 *
 * Endpoints:
 * - POST /api/application/submit - Submit an application
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, requireAuthForApi } from "@/lib/supabase/server";
import { getCurrentTimestamp } from "@/lib/utils/dateUtils";

export const dynamic = "force-dynamic";

/**
 * POST /api/application/submit
 *
 * Submits a rental application by updating its status to "submitted"
 * and recording the submission timestamp.
 *
 * @param request - Contains: applicationId
 * @returns 200 with application data on success, error response on failure
 */
export async function POST(request: NextRequest) {
    try {
        // Get authenticated user
        const user = await requireAuthForApi();
        const supabase = await createClient();

        // Parse request body
        const body = await request.json();
        const { applicationId } = body;

        // Validate required fields
        if (!applicationId) {
            return NextResponse.json(
                { error: "Application ID is required" },
                { status: 400, headers: { "Cache-Control": "no-store" } }
            );
        }

        // Fetch the application and verify ownership
        const { data: existingApp, error: checkError } = await supabase
            .from("applications")
            .select("user_id, status")
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
                { error: "Unauthorized to submit this application" },
                { status: 403, headers: { "Cache-Control": "no-store" } }
            );
        }

        // Check if application is already submitted
        if (existingApp.status === "submitted") {
            return NextResponse.json(
                { error: "Application has already been submitted" },
                { status: 400, headers: { "Cache-Control": "no-store" } }
            );
        }

        // Update application status to submitted
        const { error: updateError } = await supabase
            .from("applications")
            .update({
                status: "submitted",
                submitted_at: getCurrentTimestamp(),
                updated_at: getCurrentTimestamp(),
            })
            .eq("id", applicationId);

        if (updateError) {
            console.error("Application submit error:", updateError);
            return NextResponse.json(
                { error: updateError.message || "Failed to submit application" },
                { status: 500, headers: { "Cache-Control": "no-store" } }
            );
        }

        // Fetch the updated application
        const { data: application, error: fetchError } = await supabase
            .from("applications")
            .select("*")
            .eq("id", applicationId)
            .single();

        if (fetchError || !application) {
            console.error("Application fetch-after-submit error:", fetchError);
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

        // Return the updated application
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

