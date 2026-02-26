import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useSessionUser } from "@/lib/hooks/auth";
import type { UnitShareInsert } from "@/types/db";
import { CACHE_STRATEGIES } from "@/lib/config/cache_config";

// ============================================================================
// Query Keys
// ============================================================================

export const unitKeys = {
    all: ["units"] as const,
    byProperty: (propertyId: string) => [...unitKeys.all, propertyId] as const,
    likes: (unitId: string) => ["unit-likes", unitId] as const,
    likeCount: (unitId: string) => ["unit-like-count", unitId] as const,
    bulkLikeCounts: (unitIds: string[]) =>
        ["unit-like-counts", unitIds.sort().join(",")] as const,
    shares: (unitId: string) => ["unit-shares", unitId] as const,
    shareCount: (unitId: string) => ["unit-share-count", unitId] as const,
};

// ============================================================================
// Shared Helper Functions (used by multiple hooks)
// ============================================================================

/**
 * Toggle unit like (like/unlike) - shared by mutation hook
 */
async function toggleUnitLike(
    unitId: string,
    userId: string,
    isLiked: boolean
): Promise<boolean> {
    const supabase = createClient();

    if (isLiked) {
        // Unlike
        const { error } = await supabase
            .from("unit_likes")
            .delete()
            .eq("user_id", userId)
            .eq("unit_id", unitId);

        if (error) {
            console.error("Error unliking unit:", error);
            throw new Error(error.message);
        }

        return false;
    } else {
        // Like
        const { error } = await supabase.from("unit_likes").insert({ user_id: userId, unit_id: unitId });

        if (error) {
            console.error("Error liking unit:", error);
            throw new Error(error.message);
        }

        return true;
    }
}


// ============================================================================
// Hooks
// ============================================================================

/**
 * Get a single unit by property ID
 */
export function useUnit(propertyId: string) {
    return useQuery({
        queryKey: unitKeys.byProperty(propertyId),
        queryFn: async () => {
            const supabase = createClient();

            const { data, error } = await supabase
                .from("units")
                .select("*")
                .eq("property_id", propertyId)
                .single();

            if (error) {
                if (error.code === "PGRST116") {
                    return null; // No unit found
                }
                console.error("Error fetching unit:", error);
                throw new Error(error.message);
            }

            return data;
        },
        enabled: !!propertyId,
        ...CACHE_STRATEGIES.STATIC,
    });
}

/**
 * Get all units for a property
 */
export function useUnits(propertyId: string) {
    return useQuery({
        queryKey: unitKeys.byProperty(propertyId),
        queryFn: async () => {
            const supabase = createClient();

            const { data, error } = await supabase
                .from("units")
                .select("*")
                .eq("property_id", propertyId)
                .eq("is_active", true)
                .order("listing_type", { ascending: true })
                .order("name", { ascending: true });

            if (error) {
                console.error("Error fetching units:", error);
                throw new Error(error.message);
            }

            return data ?? [];
        },
        enabled: !!propertyId,
        ...CACHE_STRATEGIES.STATIC,
    });
}

/**
 * Check if a unit is liked by the current user
 * Uses session user internally - no need to pass userId
 */
export function useUnitLike(unitId: string, options?: { enabled?: boolean }) {
    const { data: sessionUser } = useSessionUser();

    return useQuery({
        queryKey: unitKeys.likes(unitId),
        queryFn: async () => {
            if (!sessionUser?.id) {
                return false; // Not logged in = not liked
            }

            const supabase = createClient();

            const { data, error } = await supabase
                .from("unit_likes")
                .select("*")
                .eq("user_id", sessionUser.id)
                .eq("unit_id", unitId)
                .maybeSingle();

            if (error) {
                console.error("Error checking unit like:", error);
                return false;
            }

            return !!data;
        },
        enabled:
            options?.enabled !== undefined
                ? options.enabled && !!unitId && !!sessionUser
                : !!unitId && !!sessionUser,
        ...CACHE_STRATEGIES.USER_SPECIFIC,
    });
}

/**
 * Toggle unit like (like/unlike)
 */
export function useToggleUnitLike() {
    const queryClient = useQueryClient();
    const { data: sessionUser } = useSessionUser();

    return useMutation({
        mutationFn: async ({ unitId, isLiked }: { unitId: string; isLiked: boolean }) => {
            if (!sessionUser?.id) {
                throw new Error("Unauthorized");
            }
            return toggleUnitLike(unitId, sessionUser.id, isLiked);
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: unitKeys.likes(variables.unitId) });
            queryClient.invalidateQueries({ queryKey: ["unit-likes"] });
            queryClient.invalidateQueries({ queryKey: unitKeys.likeCount(variables.unitId) });
            queryClient.invalidateQueries({ queryKey: ["unit-like-count"] });
        },
    });
}

/**
 * Get the count of likes for a unit
 */
export function useUnitLikesCount(unitId: string, options?: { enabled?: boolean }) {
    return useQuery({
        queryKey: unitKeys.likeCount(unitId),
        queryFn: async () => {
            const supabase = createClient();

            const { count, error } = await supabase
                .from("unit_likes")
                .select("*", { count: "exact", head: true })
                .eq("unit_id", unitId);

            if (error) {
                console.error("Error fetching unit likes count:", error);
                return 0;
            }

            return count ?? 0;
        },
        enabled: options?.enabled !== undefined ? options.enabled && !!unitId : !!unitId,
        ...CACHE_STRATEGIES.USER_SPECIFIC,
    });
}

/**
 * Get all shares for a unit
 */
export function useUnitShares(unitId: string) {
    return useQuery({
        queryKey: unitKeys.shares(unitId),
        queryFn: async () => {
            const supabase = createClient();

            const { data, error } = await supabase
                .from("unit_shares")
                .select("*")
                .eq("unit_id", unitId)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Error fetching unit shares:", error);
                throw new Error(error.message);
            }

            return data ?? [];
        },
        enabled: !!unitId,
        ...CACHE_STRATEGIES.USER_SPECIFIC,
    });
}

/**
 * Get the count of shares for a unit
 */
export function useUnitSharesCount(unitId: string) {
    return useQuery({
        queryKey: unitKeys.shareCount(unitId),
        queryFn: async () => {
            const supabase = createClient();

            const { count, error } = await supabase
                .from("unit_shares")
                .select("*", { count: "exact", head: true })
                .eq("unit_id", unitId);

            if (error) {
                console.error("Error fetching unit shares count:", error);
                return 0;
            }

            return count ?? 0;
        },
        enabled: !!unitId,
        ...CACHE_STRATEGIES.USER_SPECIFIC,
    });
}

/**
 * Create a new unit share
 */
export function useCreateUnitShare() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (shareData: Omit<UnitShareInsert, "id" | "created_at">) => {
            const supabase = createClient();
            const { error } = await supabase.from("unit_shares").insert([shareData]);

            if (error) {
                console.error("Error creating unit share:", error);
                throw new Error(error.message);
            }
        },
        onSuccess: (_, variables) => {
            // Invalidate shares queries for this unit
            if (variables.unit_id) {
                void queryClient.invalidateQueries({
                    queryKey: unitKeys.shares(variables.unit_id),
                });
                void queryClient.invalidateQueries({
                    queryKey: unitKeys.shareCount(variables.unit_id),
                });
            }
        },
    });
}
