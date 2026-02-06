import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { errorResponse, successResponse } from "@/app/api/utils";

export const runtime = "nodejs";

/**
 * GET /api/property/[id]
 * Fetch a single property with its units
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        // Fetch property
        const { data: property, error: propertyError } = await supabase
            .from("properties")
            .select("*")
            .eq("id", id)
            .single();

        if (propertyError || !property) {
            return errorResponse("Property not found", 404);
        }

        // Fetch units for this property
        const { data: units, error: unitsError } = await supabase
            .from("units")
            .select("*")
            .eq("property_id", id)
            .order("unit_number", { ascending: true });

        if (unitsError) {
            console.error("Error fetching units:", unitsError);
            // Continue without units rather than failing
        }

        return successResponse(
            {
                ...property,
                units: units ?? [],
            },
            200,
            {
                // Cache for 5 minutes with revalidation
                cacheControl: "public, max-age=300, stale-while-revalidate=600",
            }
        );
    } catch (error) {
        console.error("Error in GET /api/property/[id]:", error);
        return errorResponse("Internal server error", 500);
    }
}

/**
 * PATCH /api/property/[id]
 * Update a property (authenticated users only)
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        // Check authentication
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return errorResponse("Unauthorized", 401);
        }

        const body = await request.json();

        // Update property
        const { data: property, error } = await supabase
            .from("properties")
            .update(body)
            .eq("id", id)
            .eq("created_by", user.id) // Ensure user owns the property
            .select()
            .single();

        if (error) {
            console.error("Error updating property:", error);
            return errorResponse(error.message, 500);
        }

        if (!property) {
            return errorResponse("Property not found or unauthorized", 404);
        }

        return successResponse(property, 200);
    } catch (error) {
        console.error("Error in PATCH /api/property/[id]:", error);
        return errorResponse("Internal server error", 500);
    }
}

/**
 * DELETE /api/property/[id]
 * Delete a property (authenticated users only)
 */
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        // Check authentication
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return errorResponse("Unauthorized", 401);
        }

        // Delete property
        const { error } = await supabase
            .from("properties")
            .delete()
            .eq("id", id)
            .eq("created_by", user.id); // Ensure user owns the property

        if (error) {
            console.error("Error deleting property:", error);
            return errorResponse(error.message, 500);
        }

        return successResponse({ deleted: true }, 200);
    } catch (error) {
        console.error("Error in DELETE /api/property/[id]:", error);
        return errorResponse("Internal server error", 500);
    }
}
