import { NextRequest } from "next/server";
import { createClient, requireAuthForApi } from "@/lib/supabase/server";
import { uploadPropertyFiles } from "@/lib/services";
import { isAdmin } from "@/lib/utils";
import type { UnitInsert, PropertyInsert } from "@/types/db";
import { errorResponse, successResponse } from "@/app/api/utils";
import { PropertyDataSchema, UnitDataSchema } from "@/lib/validators";
import { z } from "zod";

/**
 * PUT /api/property/[id]
 * Update an existing property with units and media files
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: propertyId } = await params;

        // Get authenticated user with role (no extra DB query needed!)
        const user = await requireAuthForApi();
        const supabase = await createClient();

        // Verify property exists and user has permission
        const { data: existingProperty, error: fetchError } = await supabase
            .from("properties")
            .select("id, created_by")
            .eq("id", propertyId)
            .single();

        if (fetchError || !existingProperty) {
            return errorResponse("Property not found", 404);
        }

        // Check if user is admin or owns the property
        if (!isAdmin(user) && existingProperty.created_by !== user.id) {
            return errorResponse("Forbidden: You don't own this property", 403);
        }

        // Parse multipart form data
        const formData = await request.formData();
        const propertyDataStr = formData.get("propertyData") as string;
        const unitsDataStr = formData.get("unitsData") as string;
        const existingImagesStr = formData.get("existingImages") as string;
        const deletedUnitIdsStr = formData.get("deletedUnitIds") as string;

        // Parse and validate property data
        let propertyData = {};
        if (propertyDataStr) {
            try {
                const parsed = JSON.parse(propertyDataStr);
                propertyData = PropertyDataSchema.partial().parse(parsed);
            } catch (error) {
                const message = error instanceof Error ? error.message : "Invalid property data";
                return errorResponse(`Validation error: ${message}`, 400);
            }
        }

        // Parse and validate units data
        type ValidatedUnit = z.infer<typeof UnitDataSchema>;
        let unitsData: ValidatedUnit[] = [];
        if (unitsDataStr) {
            try {
                const parsed = JSON.parse(unitsDataStr);
                unitsData = Array.isArray(parsed)
                    ? parsed.map(unit => UnitDataSchema.parse(unit))
                    : [];
            } catch (error) {
                const message = error instanceof Error ? error.message : "Invalid units data";
                return errorResponse(`Validation error: ${message}`, 400);
            }
        }

        // Parse other data
        let existingImages: string[] = [];
        if (existingImagesStr) {
            try {
                const parsed = JSON.parse(existingImagesStr);
                existingImages = z.array(z.string()).parse(parsed);
            } catch {
                return errorResponse("Invalid existingImages format", 400);
            }
        }

        let deletedUnitIds: string[] = [];
        if (deletedUnitIdsStr) {
            try {
                const parsed = JSON.parse(deletedUnitIdsStr);
                deletedUnitIds = z.array(z.string().uuid()).parse(parsed);
            } catch {
                return errorResponse("Invalid deletedUnitIds format", 400);
            }
        }

        const imageFiles = formData.getAll("images") as File[];

        // Step 1: Delete units marked for deletion
        if (deletedUnitIds.length > 0) {
            const { error: deleteError } = await supabase
                .from("units")
                .delete()
                .in("id", deletedUnitIds)
                .eq("property_id", propertyId); // Extra safety check

            if (deleteError) {
                console.error("Error deleting units:", deleteError);
                return errorResponse(deleteError.message, 500);
            }
        }

        // Step 2: Handle units - separate new and existing
        if (unitsData.length > 0) {
            type ValidatedUnit = z.infer<typeof UnitDataSchema>;
            const newUnits = unitsData.filter((u: ValidatedUnit) => !u.id);
            const existingUnits = unitsData.filter((u: ValidatedUnit) => u.id);

            // Insert new units
            if (newUnits.length > 0) {
                const unitsToInsert = newUnits.map((unit: ValidatedUnit) => ({
                    ...unit,
                    property_id: propertyId,
                })) as UnitInsert[];

                const { error: insertError } = await supabase
                    .from("units")
                    .insert(unitsToInsert);

                if (insertError) {
                    console.error("Error inserting new units:", insertError);
                    return errorResponse(insertError.message, 500);
                }
            }

            // Update existing units
            if (existingUnits.length > 0) {
                const unitsToUpdate = existingUnits.map((unit: ValidatedUnit) => ({
                    ...unit,
                    property_id: propertyId,
                })) as UnitInsert[];

                const { error: upsertError } = await supabase
                    .from("units")
                    .upsert(unitsToUpdate);

                if (upsertError) {
                    console.error("Error updating units:", upsertError);
                    return errorResponse(upsertError.message, 500);
                }
            }
        }

        // Step 3: Handle images
        let imagePaths = [...existingImages];

        if (imageFiles.length > 0) {
            try {
                const uploadResults = await uploadPropertyFiles(imageFiles, propertyId, supabase);
                const newImagePaths = uploadResults.map((result) => result.path);
                imagePaths = [...imagePaths, ...newImagePaths];
            } catch (uploadError) {
                const message = uploadError instanceof Error ? uploadError.message : "Upload failed";
                console.error("Error uploading images:", uploadError);
                return errorResponse(message, 500);
            }
        }

        // Step 4: Update property
        const updateData: Partial<PropertyInsert> = { ...propertyData };

        // Security: Never allow changing the owner
        delete updateData.created_by;

        // Only update images if they were provided or modified
        if (imageFiles.length > 0 || existingImages.length > 0) {
            updateData.images = imagePaths.length > 0 ? imagePaths : null;
        }

        const { data: updatedProperty, error: updateError } = await supabase
            .from("properties")
            .update(updateData)
            .eq("id", propertyId)
            .select()
            .single();

        if (updateError) {
            console.error("Error updating property:", updateError);
            return errorResponse(updateError.message, 500);
        }

        return successResponse(updatedProperty, 200);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Internal server error";
        console.error("Error in PUT /api/property/[id]:", error);
        return errorResponse(message, 500);
    }
}

/**
 * DELETE /api/property/[id]
 * Delete a property and all associated units
 */
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: propertyId } = await params;

        // Get authenticated user with role (no extra DB query needed!)
        const user = await requireAuthForApi();

        const supabase = await createClient();

        // Verify property exists and user has permission
        const { data: existingProperty, error: fetchError } = await supabase
            .from("properties")
            .select("id, created_by")
            .eq("id", propertyId)
            .single();

        if (fetchError || !existingProperty) {
            return errorResponse("Property not found", 404);
        }

        // Check if user is admin or owns the property
        if (!isAdmin(user) && existingProperty.created_by !== user.id) {
            return errorResponse("Forbidden: You don't own this property", 403);
        }

        // Delete property (units will be cascade deleted if FK is set up)
        const { error: deleteError } = await supabase
            .from("properties")
            .delete()
            .eq("id", propertyId);

        if (deleteError) {
            console.error("Error deleting property:", deleteError);
            return errorResponse(deleteError.message, 500);
        }

        return successResponse({ message: "Property deleted successfully" }, 200);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Internal server error";
        console.error("Error in DELETE /api/property/[id]:", error);
        return errorResponse(message, 500);
    }
}

