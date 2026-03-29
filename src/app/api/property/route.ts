import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { uploadPropertyFiles } from "@/lib/services";
import type { UnitInsert } from "@/types/db";
import { checkRateLimit, errorResponse, getRequestIp, successResponse, precheck } from "@/app/api/utils";
import { PropertyDataSchema, UnitDataSchema } from "@/lib/validators";
import { z } from "zod";

/**
 * POST /api/property
 * Create a new property with units and media files
 */
export async function POST(request: NextRequest) {
    try {
        const check = await precheck(request, { auth: true });
        if (!check.ok) return check.error;
        const { user } = check;
        const supabase = await createClient();

        const ip = getRequestIp(request);
        const rateLimit = await checkRateLimit({
            key: `property-create:${user.id}:${ip}`,
            maxRequests: 20,
            windowSeconds: 3600,
        });
        if (!rateLimit.allowed) {
            return errorResponse(
                "Too many property submissions. Please try again later.",
                429,
                undefined,
                { additionalHeaders: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
            );
        }


        // Parse multipart form data
        const formData = await request.formData();
        const propertyDataStr = formData.get("propertyData") as string;
        const unitsDataStr = formData.get("unitsData") as string;

        if (!propertyDataStr) {
            return errorResponse("Property data is required", 400);
        }

        // Parse and validate property data
        let propertyData;
        try {
            const parsed = JSON.parse(propertyDataStr);
            propertyData = PropertyDataSchema.parse(parsed);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Invalid property data";
            return errorResponse(`Validation error: ${message}`, 400);
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

        const imageFiles = formData.getAll("images") as File[];

        // Step 1: Create property (without images initially)
        const { data: property, error: propertyError } = await supabase
            .from("properties")
            .insert({
                ...propertyData,
                is_published: propertyData.is_published ?? true,
                created_by: user.id,
                images: null,
            })
            .select()
            .single();

        if (propertyError) {
            console.error("Error creating property:", propertyError);
            return errorResponse("Failed to create property", 500);
        }

        // Step 2: Create units for this property
        if (unitsData.length > 0) {
            const unitsToInsert = unitsData.map((unit: ValidatedUnit) => ({
                ...unit,
                property_id: property.id,
            })) as UnitInsert[];

            const { error: unitsError } = await supabase
                .from("units")
                .insert(unitsToInsert);

            if (unitsError) {
                console.error("Error creating units:", unitsError);
                // Rollback: delete the property
                await supabase.from("properties").delete().eq("id", property.id);
                return errorResponse("Failed to create property units", 500);
            }
        }

        // Step 3: Upload images if provided
        if (imageFiles.length > 0) {
            try {
                const imagePaths = (
                    await uploadPropertyFiles(imageFiles, property.id, supabase)
                ).map((result) => result.path);

                // Update property with image paths
                const { data: updatedProperty, error: updateError } = await supabase
                    .from("properties")
                    .update({
                        images: imagePaths.length > 0 ? imagePaths : null,
                    })
                    .eq("id", property.id)
                    .select()
                    .single();

                if (updateError) {
                    console.error("Error updating property with images:", updateError);
                    return errorResponse("Failed to finalize property media", 500);
                }

                return successResponse(updatedProperty, 201);
            } catch (uploadError) {
                console.error("Error uploading images:", uploadError);
                return errorResponse("Failed to upload images", 500);
            }
        }

        return successResponse(property, 201);
    } catch (error) {
        console.error("Error in POST /api/property:", error);
        return errorResponse("Internal server error", 500);
    }
}
