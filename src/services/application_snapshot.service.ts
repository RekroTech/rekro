/**
 * Application Snapshot Service
 *
 * Client-side service for managing application snapshots.
 * For server-side operations, use the API routes at /api/application/snapshot
 */

import { createClient } from "@/lib/supabase/client";
import { createApplicationSnapshot } from "@/components/Application/applicationSnapshot";
import type { ApplicationSnapshot } from "@/types/application.types";
import type { ApplicationSnapshotInsert } from "@/types/db";
import type { UserProfile } from "@/types/user.types";

/**
 * Create a snapshot of an application with current user profile data
 *
 * @param applicationId - The ID of the application to snapshot
 * @param note - Optional note describing why the snapshot was created
 * @returns The created snapshot record
 *
 * @example
 * const snapshot = await createSnapshot("app-uuid", "Initial submission");
 */
export async function createSnapshot(
    applicationId: string,
    note?: string
): Promise<ApplicationSnapshotInsert> {
    const supabase = createClient();

    // Get current user
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        throw new Error("User not authenticated");
    }

    // Fetch the application
    const { data: application, error: appError } = await supabase
        .from("applications")
        .select("*")
        .eq("id", applicationId)
        .single();

    if (appError || !application) {
        throw new Error("Application not found");
    }

    // Verify ownership
    if (application.user_id !== user.id) {
        throw new Error("Unauthorized to create snapshot for this application");
    }

    // Fetch user profile with application profile
    const { data: userProfile, error: profileError } = await supabase
        .from("users")
        .select(`
            *,
            user_application_profile (*)
        `)
        .eq("id", user.id)
        .single();

    if (profileError || !userProfile) {
        throw new Error("Failed to fetch user profile");
    }

    // Create snapshot data
    const snapshotData = createApplicationSnapshot(
        {
            ...userProfile,
            user_application_profile: Array.isArray(userProfile.user_application_profile)
                ? userProfile.user_application_profile[0] || null
                : userProfile.user_application_profile,
        } as UserProfile,
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

    // Insert snapshot
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
        throw new Error(snapshotError?.message || "Failed to create snapshot");
    }

    return snapshot;
}

/**
 * Get all snapshots for an application
 *
 * @param applicationId - The ID of the application
 * @returns Array of snapshots, ordered by creation date (newest first)
 *
 * @example
 * const snapshots = await getApplicationSnapshots("app-uuid");
 */
export async function getApplicationSnapshots(applicationId: string) {
    const supabase = createClient();

    // Get current user
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        throw new Error("User not authenticated");
    }

    // Verify application ownership
    const { data: application, error: appError } = await supabase
        .from("applications")
        .select("user_id")
        .eq("id", applicationId)
        .single();

    if (appError || !application) {
        throw new Error("Application not found");
    }

    if (application.user_id !== user.id) {
        throw new Error("Unauthorized to view snapshots for this application");
    }

    // Fetch snapshots
    const { data: snapshots, error } = await supabase
        .from("application_snapshot")
        .select("*")
        .eq("application_id", applicationId)
        .order("created_at", { ascending: false });

    if (error) {
        throw new Error(error.message);
    }

    return snapshots || [];
}

/**
 * Get the latest snapshot for an application
 *
 * @param applicationId - The ID of the application
 * @returns The most recent snapshot, or null if none exists
 *
 * @example
 * const latestSnapshot = await getLatestSnapshot("app-uuid");
 */
export async function getLatestSnapshot(applicationId: string) {
    const supabase = createClient();

    const { data, error } = await supabase
        .from("application_snapshot")
        .select("*")
        .eq("application_id", applicationId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

    if (error) {
        if (error.code === "PGRST116") {
            // No rows returned
            return null;
        }
        throw new Error(error.message);
    }

    return data;
}

/**
 * Get a specific snapshot by ID
 *
 * @param snapshotId - The ID of the snapshot
 * @returns The snapshot record
 *
 * @example
 * const snapshot = await getSnapshotById("snapshot-uuid");
 */
export async function getSnapshotById(snapshotId: string) {
    const supabase = createClient();

    // Get current user
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        throw new Error("User not authenticated");
    }

    // Fetch the snapshot
    const { data: snapshot, error } = await supabase
        .from("application_snapshot")
        .select("*, applications!inner(user_id)")
        .eq("id", snapshotId)
        .single();

    if (error || !snapshot) {
        throw new Error("Snapshot not found");
    }

    // Verify ownership through the application
    // Note: applications is returned as an object from the inner join
    const application = snapshot.applications as unknown as { user_id: string };
    if (!application || application.user_id !== user.id) {
        throw new Error("Unauthorized to view this snapshot");
    }

    return snapshot;
}

/**
 * Compare two snapshots to see what changed
 *
 * @param snapshotId1 - First snapshot ID
 * @param snapshotId2 - Second snapshot ID
 * @returns Object containing the differences between snapshots
 *
 * @example
 * const diff = await compareSnapshots("snapshot1-uuid", "snapshot2-uuid");
 */
export async function compareSnapshots(snapshotId1: string, snapshotId2: string) {
    const [snapshot1, snapshot2] = await Promise.all([
        getSnapshotById(snapshotId1),
        getSnapshotById(snapshotId2),
    ]);

    // Simple comparison - can be enhanced with deep diff library
    return {
        snapshot1: {
            id: snapshot1.id,
            created_at: snapshot1.created_at,
            data: snapshot1.snapshot,
        },
        snapshot2: {
            id: snapshot2.id,
            created_at: snapshot2.created_at,
            data: snapshot2.snapshot,
        },
        // Add more sophisticated diff logic here if needed
    };
}

/**
 * Count snapshots for an application
 *
 * @param applicationId - The ID of the application
 * @returns The number of snapshots
 *
 * @example
 * const count = await countSnapshots("app-uuid");
 */
export async function countSnapshots(applicationId: string): Promise<number> {
    const supabase = createClient();

    const { count, error } = await supabase
        .from("application_snapshot")
        .select("*", { count: "exact", head: true })
        .eq("application_id", applicationId);

    if (error) {
        throw new Error(error.message);
    }

    return count || 0;
}

/**
 * Delete a snapshot (use with caution - snapshots should generally be immutable)
 *
 * @param snapshotId - The ID of the snapshot to delete
 * @returns True if deleted successfully
 *
 * @example
 * await deleteSnapshot("snapshot-uuid");
 */
export async function deleteSnapshot(snapshotId: string): Promise<boolean> {
    const supabase = createClient();

    // Get current user
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        throw new Error("User not authenticated");
    }

    // Verify ownership before deletion
    await getSnapshotById(snapshotId); // This will throw if unauthorized

    const { error } = await supabase
        .from("application_snapshot")
        .delete()
        .eq("id", snapshotId);

    if (error) {
        throw new Error(error.message);
    }

    return true;
}

/**
 * Extract typed snapshot data from a database snapshot record
 *
 * @param snapshot - The database snapshot record
 * @returns Typed ApplicationSnapshot data
 *
 * @example
 * const typedData = extractSnapshotData(dbSnapshot);
 */
export function extractSnapshotData(snapshot: ApplicationSnapshotInsert): ApplicationSnapshot {
    return snapshot.snapshot as unknown as ApplicationSnapshot;
}

// Export all functions as a service object
export const applicationSnapshotService = {
    createSnapshot,
    getApplicationSnapshots,
    getLatestSnapshot,
    getSnapshotById,
    compareSnapshots,
    countSnapshots,
    deleteSnapshot,
    extractSnapshotData,
};

