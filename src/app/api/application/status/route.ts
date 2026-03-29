/**
 * Application Status Update API Route Handler
 *
 * Server-side API endpoint for updating application status (admin only).
 * Following Next.js App Router best practices.
 *
 * Endpoints:
 * - PATCH /api/application/status - Update application status
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTimestamp } from "@/lib/utils";
import { dbErrorResponse, precheck } from "@/app/api/utils";

export const dynamic = "force-dynamic";

const VALID_STATUSES = ["draft", "submitted", "under_review", "approved", "rejected", "withdrawn"];

/**
 * PATCH /api/application/status
 *
 * Updates an application's status.
 * Only admin users can update application status.
 *
 * @param request - Contains: applicationId, status
 * @returns 200 with updated application data on success, error response on failure
 */
export async function PATCH(request: NextRequest) {
    try {
        const check = await precheck(request, { auth: true, roles: ["admin"] });
        if (!check.ok) return check.error;
        const supabase = await createClient();

        // Parse request body
        const body = await request.json();
        const { applicationId, status } = body;

        // Validate required fields
        if (!applicationId || !status) {
            return NextResponse.json(
                { error: "Application ID and status are required" },
                { status: 400, headers: { "Cache-Control": "no-store" } }
            );
        }

        // Validate status value
        if (!VALID_STATUSES.includes(status)) {
            return NextResponse.json(
                { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
                { status: 400, headers: { "Cache-Control": "no-store" } }
            );
        }

        // Verify the application exists
        const { data: existingApp, error: checkError } = await supabase
            .from("applications")
            .select("id")
            .eq("id", applicationId)
            .single();

        if (checkError || !existingApp) {
            return NextResponse.json(
                { error: "Application not found" },
                { status: 404, headers: { "Cache-Control": "no-store" } }
            );
        }

        // Update application status
        const { data: application, error: updateError } = await supabase
            .from("applications")
            .update({
                status,
                updated_at: getCurrentTimestamp(),
            })
            .eq("id", applicationId)
            .select()
            .single();

        if (updateError) {
            return dbErrorResponse("application/status update", updateError, "Failed to update application status");
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
        console.error("Application status update error:", error);


        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500, headers: { "Cache-Control": "no-store" } }
        );
    }
}

