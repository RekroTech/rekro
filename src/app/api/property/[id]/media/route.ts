import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { uploadPropertyFiles } from "@/lib/services";
import { isAdmin } from "@/lib/utils";
import { dbErrorResponse, errorResponse, successResponse, precheck } from "@/app/api/utils";

/**
 * POST /api/property/[id]/media
 * Upload property media after property creation (non-blocking create flow)
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: propertyId } = await params;
        const check = await precheck(request, { auth: true });
        if (!check.ok) return check.error;
        const { user } = check;

        const supabase = await createClient();

        const { data: property, error: fetchError } = await supabase
            .from("properties")
            .select("id, created_by, images")
            .eq("id", propertyId)
            .single();

        if (fetchError || !property) {
            return errorResponse("Property not found", 404);
        }

        if (!isAdmin(user) && property.created_by !== user.id) {
            return errorResponse("Forbidden: You don't own this property", 403);
        }

        const formData = await request.formData();
        const imageFiles = formData
            .getAll("images")
            .filter((value): value is File => value instanceof File);

        if (imageFiles.length === 0) {
            return errorResponse("At least one image is required", 400);
        }

        const uploadResults = await uploadPropertyFiles(imageFiles, propertyId, supabase);
        const newImagePaths = uploadResults.map((result) => result.path);

        const existingImages = Array.isArray(property.images) ? property.images : [];
        const mergedImages = Array.from(new Set([...existingImages, ...newImagePaths]));

        const { data: updatedProperty, error: updateError } = await supabase
            .from("properties")
            .update({
                images: mergedImages.length > 0 ? mergedImages : null,
            })
            .eq("id", propertyId)
            .select()
            .single();

        if (updateError) {
            return dbErrorResponse("property/[id]/media update-images", updateError, "Failed to update property images");
        }

        return successResponse(
            {
                property: updatedProperty,
                media: {
                    status: "ready",
                    uploadedCount: newImagePaths.length,
                },
            },
            200
        );
    } catch (error) {
        console.error("Error in POST /api/property/[id]/media:", error);
        return errorResponse("Internal server error", 500);
    }
}

