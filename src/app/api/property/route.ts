import { NextRequest } from "next/server";
import { createClient, requireAuthForApi } from "@/lib/supabase/server";
import { uploadPropertyFiles } from "@/lib/services/storage.service";
import { successResponse, errorResponse } from "../utils";
import type { UnitInsert } from "@/types/db";

/**
 * POST /api/property
 * Create a new property with units and media files
 */
export async function POST(request: NextRequest) {
    try {
        // Get authenticated user with role (no extra DB query needed!)
        const user = await requireAuthForApi();

        const supabase = await createClient();


        // Parse multipart form data
        const formData = await request.formData();
        const propertyDataStr = formData.get("propertyData") as string;
        const unitsDataStr = formData.get("unitsData") as string;

        if (!propertyDataStr) {
            return errorResponse("Property data is required", 400);
        }

        const propertyData = JSON.parse(propertyDataStr);
        const unitsData = unitsDataStr ? JSON.parse(unitsDataStr) : [];
        const imageFiles = formData.getAll("images") as File[];

        // Step 1: Create property (without images initially)
        const { data: property, error: propertyError } = await supabase
            .from("properties")
            .insert({
                ...propertyData,
                created_by: user.id,
                images: null,
                video_url: null,
            })
            .select()
            .single();

        if (propertyError) {
            console.error("Error creating property:", propertyError);
            return errorResponse(propertyError.message, 500);
        }

        // Step 2: Create units for this property
        if (unitsData.length > 0) {
            const unitsToInsert = unitsData.map((unit: Omit<UnitInsert, "id" | "property_id">) => ({
                ...unit,
                property_id: property.id,
            }));

            const { error: unitsError } = await supabase
                .from("units")
                .insert(unitsToInsert);

            if (unitsError) {
                console.error("Error creating units:", unitsError);
                // Rollback: delete the property
                await supabase.from("properties").delete().eq("id", property.id);
                return errorResponse(unitsError.message, 500);
            }
        }

        // Step 3: Upload images if provided
        if (imageFiles.length > 0) {
            try {
                const uploadResults = await uploadPropertyFiles(imageFiles, property.id);
                const imagePaths = uploadResults.map((result) => result.path);

                // Update property with image paths
                const { data: updatedProperty, error: updateError } = await supabase
                    .from("properties")
                    .update({ images: imagePaths })
                    .eq("id", property.id)
                    .select()
                    .single();

                if (updateError) {
                    console.error("Error updating property with images:", updateError);
                    return errorResponse(updateError.message, 500);
                }

                return successResponse(updatedProperty, 201);
            } catch (uploadError) {
                const message = uploadError instanceof Error ? uploadError.message : "Upload failed";
                console.error("Error uploading images:", uploadError);
                return errorResponse(message, 500);
            }
        }

        return successResponse(property, 201);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Internal server error";
        console.error("Error in POST /api/property:", error);
        return errorResponse(message, 500);
    }
}

