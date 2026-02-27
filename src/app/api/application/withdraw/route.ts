/**
 * Application Withdraw API Route Handler
 *
 * Server-side API endpoint for withdrawing rental applications.
 * Following Next.js App Router best practices.
 *
 * Endpoints:
 * - POST /api/application/withdraw - Withdraw an application
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, requireAuthForApi } from "@/lib/supabase/server";
import { getCurrentTimestamp } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * POST /api/application/withdraw
 *
 * Withdraws a rental application (sets status to 'withdrawn').
 * Only the application owner can withdraw their application.
 * Only applications with status 'submitted' or 'under_review' can be withdrawn.
 *
 * @param request - Contains: applicationId
 * @returns 200 with updated application data on success, error response on failure
 */
export async function POST(request: NextRequest) {
    try {
        // Check authentication
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

        // Verify the application belongs to the user and check current status
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
                { error: "Unauthorized to withdraw this application" },
                { status: 403, headers: { "Cache-Control": "no-store" } }
            );
        }

        // Check if application can be withdrawn
        if (existingApp.status !== "submitted" && existingApp.status !== "under_review") {
            return NextResponse.json(
                { error: "Application cannot be withdrawn in its current status" },
                { status: 400, headers: { "Cache-Control": "no-store" } }
            );
        }

        // Update application status to withdrawn
        const { data: application, error: updateError } = await supabase
            .from("applications")
            .update({
                status: "withdrawn",
                updated_at: getCurrentTimestamp(),
            })
            .eq("id", applicationId)
            .select()
            .single();

        if (updateError) {
            console.error("Application withdrawal error:", updateError);
            return NextResponse.json(
                { error: updateError.message || "Failed to withdraw application" },
                { status: 500, headers: { "Cache-Control": "no-store" } }
            );
        }

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
        console.error("Application withdrawal error:", error);

        // Handle authentication errors
        if (error instanceof Error && error.message === "Unauthorized") {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401, headers: { "Cache-Control": "no-store" } }
            );
        }

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500, headers: { "Cache-Control": "no-store" } }
        );
    }
}

