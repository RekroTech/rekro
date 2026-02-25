import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useSessionUser } from "@/lib/react-query/hooks/auth";
import type { Unit, UnitShareInsert } from "@/types/db";
import { CACHE_STRATEGIES } from "@/lib/react-query/config";

// ============================================================================
// Query Keys
// ============================================================================

export const unitKeys = {
    all: ["units"] as const,
    byProperty: (propertyId: string) => [...unitKeys.all, propertyId] as const,
    likes: (unitId: string, userId: string) => ["unit-likes", unitId, userId] as const,
    likeCount: (unitId: string) => ["unit-like-count", unitId] as const,
    bulkLikeCounts: (unitIds: string[]) =>
        ["unit-like-counts", unitIds.sort().join(",")] as const,
    shares: (unitId: string) => ["unit-shares", unitId] as const,
    shareCount: (unitId: string) => ["unit-share-count", unitId] as const,
};

// ============================================================================
// Query Functions (Direct Supabase - Following Next.js 15 Best Practices)
// ============================================================================

/**
 * Get a single unit by property ID
 */
async function fetchUnitByPropertyId(propertyId: string): Promise<Unit | null> {
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
}

/**
 * Get all units for a property
 */
async function fetchUnitsByPropertyId(propertyId: string): Promise<Unit[]> {
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
}

/**
 * Check if a unit is liked by a user
 */
async function checkUnitLiked(unitId: string, userId: string): Promise<boolean> {
    if (!userId) return false;

    const supabase = createClient();

    const { data, error } = await supabase
        .from("unit_likes")
        .select("*")
        .eq("user_id", userId)
        .eq("unit_id", unitId)
        .maybeSingle();

    if (error) {
        console.error("Error checking unit like:", error);
        return false;
    }

    return !!data;
}

/**
 * Toggle unit like (like/unlike)
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

/**
 * Get the number of likes for a unit
 */
async function fetchUnitLikesCount(unitId: string): Promise<number> {
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
}

/**
 * Get the number of likes for multiple units
 * Returns a map of unitId -> count
 */
async function fetchBulkUnitLikesCounts(unitIds: string[]): Promise<Record<string, number>> {
    if (unitIds.length === 0) return {};

    const supabase = createClient();

    const { data, error } = await supabase
        .from("unit_likes")
        .select("unit_id")
        .in("unit_id", unitIds);

    if (error) {
        console.error("Error fetching bulk unit likes counts:", error);
        return {};
    }

    // Initialize counts for all units
    const counts: Record<string, number> = {};
    unitIds.forEach((id) => (counts[id] = 0));

    // Count likes per unit
    data?.forEach((like) => {
        counts[like.unit_id] = (counts[like.unit_id] || 0) + 1;
    });

    return counts;
}

/**
 * Get all shares for a unit
 */
async function fetchUnitSharesByUnit(unitId: string) {
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
}

/**
 * Get the count of shares for a unit
 */
async function fetchUnitSharesCount(unitId: string): Promise<number> {
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
}

/**
 * Create a new unit share
 */
async function createUnitShareMutation(
    shareData: Omit<UnitShareInsert, "id" | "created_at">
): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from("unit_shares").insert([shareData]);

    if (error) {
        console.error("Error creating unit share:", error);
        throw new Error(error.message);
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
        queryFn: () => fetchUnitByPropertyId(propertyId),
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
        queryFn: () => fetchUnitsByPropertyId(propertyId),
        enabled: !!propertyId,
        ...CACHE_STRATEGIES.STATIC,
    });
}

/**
 * Check if a unit is liked by the current user
 */
export function useUnitLike(unitId: string, options?: { enabled?: boolean }) {
    const { data: sessionUser } = useSessionUser();

    return useQuery({
        queryKey: unitKeys.likes(unitId, sessionUser?.id ?? "anonymous"),
        queryFn: () => checkUnitLiked(unitId, sessionUser?.id ?? ""),
        enabled:
            options?.enabled !== undefined
                ? options.enabled && !!unitId && !!sessionUser?.id
                : !!unitId && !!sessionUser?.id,
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
            const userId = sessionUser?.id || "anonymous";
            queryClient.invalidateQueries({ queryKey: unitKeys.likes(variables.unitId, userId) });
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
        queryFn: () => fetchUnitLikesCount(unitId),
        enabled: options?.enabled !== undefined ? options.enabled && !!unitId : !!unitId,
        ...CACHE_STRATEGIES.USER_SPECIFIC,
    });
}

/**
 * Get the count of likes for multiple units
 */
export function useBulkUnitLikesCounts(unitIds: string[], options?: { enabled?: boolean }) {
    const hasUnits = unitIds.length > 0;

    return useQuery({
        queryKey: unitKeys.bulkLikeCounts(unitIds),
        queryFn: async () => {
            if (!hasUnits) return {};
            return fetchBulkUnitLikesCounts(unitIds);
        },
        enabled: options?.enabled !== undefined ? options.enabled && hasUnits : hasUnits,
        ...CACHE_STRATEGIES.USER_SPECIFIC,
    });
}

/**
 * Get all shares for a unit
 */
export function useUnitShares(unitId: string) {
    return useQuery({
        queryKey: unitKeys.shares(unitId),
        queryFn: () => fetchUnitSharesByUnit(unitId),
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
        queryFn: () => fetchUnitSharesCount(unitId),
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
            return createUnitShareMutation(shareData);
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
