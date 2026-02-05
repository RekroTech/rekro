import { createClient } from "@/lib/supabase/client";
import type {
    Application,
    ApplicationDetails,
    CreateApplicationRequest,
} from "@/types/application.types";

export interface ApplicationWithDetails extends Application {
    details: ApplicationDetails | null;
}

/**
 * Create a new application with details
 */
export async function createApplication(
    request: CreateApplicationRequest
): Promise<ApplicationWithDetails> {
    const supabase = createClient();

    // Get current user
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        throw new Error("User not authenticated");
    }

    // Create the application
    const { data: application, error: applicationError } = await supabase
        .from("applications")
        .insert({
            user_id: user.id,
            property_id: request.propertyId,
            unit_id: request.unitId || null,
            application_type: request.applicationType,
            status: "submitted",
            message: request.formData.message || null,
            submitted_at: new Date().toISOString(),
        })
        .select()
        .single();

    if (applicationError || !application) {
        throw new Error(applicationError?.message || "Failed to create application");
    }

    // Create application details
    const { data: details, error: detailsError } = await supabase
        .from("application_details")
        .insert({
            application_id: application.id,
            move_in_date: request.formData.moveInDate || null,
            rental_duration: request.formData.rentalDuration || null,
            employment_status: request.formData.employmentStatus || null,
            income_source: request.formData.incomeSource || null,
            contact_phone: request.formData.phone || null,
            has_pets: request.formData.hasPets,
            smoker: request.formData.smoker,
            notes: request.formData.additionalInfo || null,
        })
        .select()
        .single();

    if (detailsError) {
        // If details insertion fails, we should delete the application
        await supabase.from("applications").delete().eq("id", application.id);
        throw new Error(detailsError?.message || "Failed to create application details");
    }

    return {
        ...application,
        details,
    };
}

/**
 * Get applications for the current user
 */
export async function getUserApplications(): Promise<ApplicationWithDetails[]> {
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
        .select(
            `
      *,
      details:application_details(*)
    `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {
        throw new Error(error.message);
    }

    return (applications || []).map((app) => ({
        ...app,
        details: Array.isArray(app.details) ? app.details[0] : app.details,
    }));
}

/**
 * Get a specific application by ID
 */
export async function getApplicationById(id: string): Promise<ApplicationWithDetails | null> {
    const supabase = createClient();

    const { data: application, error } = await supabase
        .from("applications")
        .select(
            `
      *,
      details:application_details(*)
    `
        )
        .eq("id", id)
        .single();

    if (error) {
        if (error.code === "PGRST116") {
            return null;
        }
        throw new Error(error.message);
    }

    return {
        ...application,
        details: Array.isArray(application.details) ? application.details[0] : application.details,
    };
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
