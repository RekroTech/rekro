import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { errorResponse, successResponse } from "@/app/api/utils";

export const runtime = "nodejs";

/**
 * GET /api/property/likes
 * Returns the authenticated user's liked units joined with their properties.
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return errorResponse("Unauthorized", 401);
        }

        const { searchParams } = request.nextUrl;
        const limit = parseInt(searchParams.get("limit") || "50", 10);
        const offset = parseInt(searchParams.get("offset") || "0", 10);

        // We treat "liked properties" as liked units (property_likes has unit_id)
        const { data, error, count } = await supabase
            .from("property_likes")
            .select(
                `
                unit_id,
                created_at,
                units:unit_id (
                    *,
                    properties:property_id (*)
                )
            `,
                { count: "exact" }
            )
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error("Error fetching liked properties:", error);
            return errorResponse(error.message, 500);
        }

        const total = count ?? 0;
        const nextOffset = offset + limit;
        const hasMore = nextOffset < total;

        return successResponse(
            {
                likes: data ?? [],
                nextOffset: hasMore ? nextOffset : null,
                hasMore,
                total,
            },
            200,
            {
                cacheControl: "private, max-age=30, stale-while-revalidate=60",
            }
        );
    } catch (error) {
        console.error("Error in GET /api/property/likes:", error);
        return errorResponse("Internal server error", 500);
    }
}

