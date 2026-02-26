/**
 * Application Snapshot API Route Handler
 *
 * Creates a snapshot of an application with complete user profile data
 * at the time of submission. Snapshots are immutable historical records.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, requireAuthForApi } from "@/lib/supabase/server";
import { createApplicationSnapshot } from "@/app/api/utils";


export const dynamic = "force-dynamic";

/**
 * POST /api/application/snapshot
 *
 * Creates a snapshot of an application with user profile data
 *
 * @param request - Contains: applicationId, note (optional)
 * @returns 201 with snapshot data on success, error response on failure
 */
export async function POST(request: NextRequest) {
    try {
        // Get authenticated user with role (no extra DB query needed!)
        const user = await requireAuthForApi();
        const supabase = await createClient();

        // Parse request body
        const body = await request.json();
        const { applicationId, note } = body;

        if (!applicationId) {
            return NextResponse.json(
                { error: "Application ID is required" },
                { status: 400, headers: { "Cache-Control": "no-store" } }
            );
        }

        // Fetch the application and verify ownership
        const { data: application, error: appError } = await supabase
            .from("applications")
            .select("*")
            .eq("id", applicationId)
            .single();

        if (appError || !application) {
            return NextResponse.json(
                { error: "Application not found" },
                { status: 404, headers: { "Cache-Control": "no-store" } }
            );
        }

        if (application.user_id !== user.id) {
            return NextResponse.json(
                { error: "Unauthorized to create snapshot for this application" },
                { status: 403, headers: { "Cache-Control": "no-store" } }
            );
        }

        // Fetch user profile with application profile data
        const { data: userProfile, error: profileError } = await supabase
            .from("users")
            .select(`
                *,
                user_application_profile (*)
            `)
            .eq("id", user.id)
            .single();

        if (profileError || !userProfile) {
            return NextResponse.json(
                { error: "Failed to fetch user profile" },
                { status: 500, headers: { "Cache-Control": "no-store" } }
            );
        }

        // Create the snapshot data
        const snapshotData = createApplicationSnapshot(
            {
                ...userProfile,
                user_application_profile: Array.isArray(userProfile.user_application_profile)
                    ? userProfile.user_application_profile[0] || null
                    : userProfile.user_application_profile,
            },
            {
                moveInDate: application.move_in_date || "",
                rentalDuration: application.rental_duration?.toString() || "",
                applicationType: application.application_type,
                propertyId: application.property_id,
                unitId: application.unit_id,
                proposedRent: application.proposed_rent || undefined,
                totalRent: application.total_rent || undefined,
                inclusions: application.inclusions || {},
                occupancyType: application.occupancy_type,
                message: application.message || undefined,
            }
        );

        // Insert the snapshot
        const { data: snapshot, error: snapshotError } = await supabase
            .from("application_snapshot")
            .insert({
                application_id: applicationId,
                snapshot: snapshotData as unknown as Record<string, unknown>,
                created_by: user.id,
                note: note || null,
            })
            .select()
            .single();

        if (snapshotError || !snapshot) {
            console.error("Snapshot creation error:", snapshotError);
            return NextResponse.json(
                { error: snapshotError?.message || "Failed to create snapshot" },
                { status: 500, headers: { "Cache-Control": "no-store" } }
            );
        }

        return NextResponse.json(
            {
                success: true,
                data: snapshot,
            },
            {
                status: 201,
                headers: {
                    "Cache-Control": "no-store",
                },
            }
        );
    } catch (error) {
        console.error("Snapshot creation error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500, headers: { "Cache-Control": "no-store" } }
        );
    }
}