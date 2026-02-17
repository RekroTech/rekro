import { createClient } from "@/lib/supabase/client";
import type {
    CreateApplicationRequest,
} from "@/types/application.types";
import { Application } from "@/types/db";

/**
 * Create or update an application
 * Uses upsert to handle both create and update operations seamlessly
 */
export async function upsertApplication(
    request: CreateApplicationRequest
): Promise<Application> {
    const supabase = createClient();

    // Get current user
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        throw new Error("User not authenticated");
    }

    // If updating, verify the application belongs to the user
    if (request.applicationId) {
        const { data: existingApp, error: checkError } = await supabase
            .from("applications")
            .select("user_id")
            .eq("id", request.applicationId)
            .single();

        if (checkError || !existingApp) {
            throw new Error("Application not found");
        }

        if (existingApp.user_id !== user.id) {
            throw new Error("Unauthorized to update this application");
        }
    }


    // Prepare application data
    const applicationData = {
        ...(request.applicationId ? { id: request.applicationId } : {}),
        user_id: user.id,
        property_id: request.propertyId,
        unit_id: request.unitId || null,
        application_type: request.applicationType,
        status: "submitted",
        message: request.message || null,
        submitted_at: request.applicationId ? undefined : new Date().toISOString(),
        move_in_date: request.moveInDate || null,
        rental_duration: request.rentalDuration ? parseInt(request.rentalDuration, 10) : null,
        proposed_rent: request.proposedRent ? parseFloat(request.proposedRent) : null,
        total_rent: request.totalRent || null,
        inclusions: request.inclusions || {},
        occupancy_type: request.occupancyType,
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
        throw new Error(applicationError?.message || "Failed to save application");
    }

    return application;
}

/**
 * Get applications for the current user
 */
export async function getUserApplications(): Promise<Application[]> {
    const supabase = createClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        throw new Error("User not authenticated");
    }

    const { data: applications, error } = await supabase
        .from("applications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {
        throw new Error(error.message);
    }

    return applications || [];
}

/**
 * Get a specific application by ID
 */
export async function getApplicationById(id: string): Promise<Application | null> {
    const supabase = createClient();

    const { data: application, error } = await supabase
        .from("applications")
        .select("*")
        .eq("id", id)
        .single();

    if (error) {
        if (error.code === "PGRST116") {
            return null;
        }
        throw new Error(error.message);
    }

    return application;
}

/**
 * Update application status
 */
export async function updateApplicationStatus(
    id: string,
    status: Application["status"]
): Promise<Application> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from("applications")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

    if (error || !data) {
        throw new Error(error?.message || "Failed to update application status");
    }

    return data;
}

/**
 * Withdraw an application
 */
export async function withdrawApplication(id: string): Promise<Application> {
    return updateApplicationStatus(id, "withdrawn");
}

/**
 * Get application snapshot by application ID
 */
export async function getApplicationSnapshot(applicationId: string) {
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
            return null;
        }
        throw new Error(error.message);
    }

    return data;
}
