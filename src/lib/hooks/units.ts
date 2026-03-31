import { useMutation, useQuery, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useSessionUser } from "@/lib/hooks/auth";
import type { UnitShareInsert } from "@/types/db";
import type { GetPropertiesResponse } from "@/types/property.types";
import { CACHE_STRATEGIES } from "@/lib/config/cache_config";
import { propertyKeys } from "@/lib/hooks/property";

// ============================================================================
// Query Keys
// ============================================================================

export const unitKeys = {
    all: ["units"] as const,
    byProperty: (propertyId: string) => [...unitKeys.all, propertyId] as const,
    likes: (unitId: string) => ["unit-likes", unitId] as const,
    likeCount: (unitId: string) => ["unit-like-count", unitId] as const,
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

function patchLikeInPropertyLists(
    oldData: InfiniteData<GetPropertiesResponse> | undefined,
    unitId: string,
    nextLiked: boolean
) {
    if (!oldData) return oldData;

    return {
        ...oldData,
        pages: oldData.pages.map((page) => ({
            ...page,
            data: page.data.map((property) => ({
                ...property,
                units: property.units?.map((unit) => {
                    if (unit.id !== unitId) return unit;
                    const currentCount = unit.likesCount ?? 0;
                    const nextCount = nextLiked
                        ? currentCount + 1
                        : Math.max(0, currentCount - 1);

                    return {
                        ...unit,
                        isLiked: nextLiked,
                        likesCount: nextCount,
                    };
                }),
            })),
        })),
    };
}

function patchLikeInPropertyDetail<T extends { units?: Array<{ id: string; isLiked?: boolean; likesCount?: number }> }>(
    oldData: T | undefined,
    unitId: string,
    nextLiked: boolean
) {
    if (!oldData?.units) return oldData;

    return {
        ...oldData,
        units: oldData.units.map((unit) => {
            if (unit.id !== unitId) return unit;
            const currentCount = unit.likesCount ?? 0;
            const nextCount = nextLiked
                ? currentCount + 1
                : Math.max(0, currentCount - 1);

            return {
                ...unit,
                isLiked: nextLiked,
                likesCount: nextCount,
            };
        }),
    } as T;
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
                .eq("status", "active")
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
        onMutate: async ({ unitId, isLiked }) => {
            const nextLiked = !isLiked;
            const previousLiked = queryClient.getQueryData<boolean>(unitKeys.likes(unitId));
            const previousLikeCount = queryClient.getQueryData<number>(unitKeys.likeCount(unitId));

            queryClient.setQueryData(unitKeys.likes(unitId), nextLiked);

            if (typeof previousLikeCount === "number") {
                queryClient.setQueryData(
                    unitKeys.likeCount(unitId),
                    nextLiked ? previousLikeCount + 1 : Math.max(0, previousLikeCount - 1)
                );
            }

            queryClient.setQueriesData(
                { queryKey: propertyKeys.lists() },
                (oldData: InfiniteData<GetPropertiesResponse> | undefined) =>
                    patchLikeInPropertyLists(oldData, unitId, nextLiked)
            );

            queryClient.setQueriesData(
                { queryKey: propertyKeys.details() },
                (
                    oldData:
                        | { units?: Array<{ id: string; isLiked?: boolean; likesCount?: number }> }
                        | undefined
                ) => patchLikeInPropertyDetail(oldData, unitId, nextLiked)
            );

            return {
                unitId,
                previousLiked,
                previousLikeCount,
                previousLists: queryClient.getQueriesData({ queryKey: propertyKeys.lists() }),
                previousDetails: queryClient.getQueriesData({ queryKey: propertyKeys.details() }),
            };
        },
        onError: (_error, _variables, context) => {
            if (!context) return;

            if (context.previousLiked !== undefined) {
                queryClient.setQueryData(unitKeys.likes(context.unitId), context.previousLiked);
            }

            if (typeof context.previousLikeCount === "number") {
                queryClient.setQueryData(unitKeys.likeCount(context.unitId), context.previousLikeCount);
            }

            context.previousLists.forEach(([queryKey, data]) => {
                queryClient.setQueryData(queryKey, data);
            });

            context.previousDetails.forEach(([queryKey, data]) => {
                queryClient.setQueryData(queryKey, data);
            });
        },
        onSettled: (_data, _error, variables) => {
            // Keep single-unit hooks fresh without triggering broad list refetches.
            void queryClient.invalidateQueries({ queryKey: unitKeys.likes(variables.unitId) });
            void queryClient.invalidateQueries({ queryKey: unitKeys.likeCount(variables.unitId) });
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
