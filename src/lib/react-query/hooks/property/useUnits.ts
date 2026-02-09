import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    checkUnitLiked,
    getUnitByPropertyIdClient,
    getUnitsByPropertyIdClient,
    toggleUnitLike,
} from "@/services/unit.service";
// NOTE: unit_availability hooks below are kept for future use but availability data
// is now stored directly on the units table (available_from, available_to, is_available)
import {
    createUnitAvailabilityClient,
    deleteUnitAvailabilityByUnitIdClient,
    getUnitAvailabilityByUnitIdClient,
    updateUnitAvailabilityClient,
} from "@/services/unit_availability.service";
import { UnitAvailabilityInsert } from "@/types/db";
import { useUser } from "@/lib/react-query/hooks/auth/useAuth";
import { getBulkPropertyLikes } from "@/services/property.service";

// Query keys for better cache management
export const unitKeys = {
    all: ["units"] as const,
    lists: () => [...unitKeys.all, "list"] as const,
    list: (propertyId: string) => [...unitKeys.lists(), propertyId] as const,
    details: () => [...unitKeys.all, "detail"] as const,
    detail: (propertyId: string) => [...unitKeys.details(), propertyId] as const,
    likes: () => [...unitKeys.all, "likes"] as const,
    like: (unitId: string) => [...unitKeys.likes(), unitId] as const,
    bulkLikes: (unitIds: string[], userId: string) =>
        [...unitKeys.likes(), "bulk", unitIds.sort().join(","), userId] as const,
    availability: () => [...unitKeys.all, "availability"] as const,
    availabilityDetail: (unitId: string) => [...unitKeys.availability(), unitId] as const,
};

export function useUnit(propertyId: string) {
    return useQuery({
        queryKey: unitKeys.detail(propertyId),
        queryFn: () => getUnitByPropertyIdClient(propertyId),
        enabled: !!propertyId,
    });
}

export function useUnits(propertyId: string) {
    return useQuery({
        queryKey: unitKeys.list(propertyId),
        queryFn: () => getUnitsByPropertyIdClient(propertyId),
        enabled: !!propertyId,
    });
}

// Unit Likes Hooks
export function useUnitLike(unitId: string, options?: { enabled?: boolean }) {
    const { data: user } = useUser();

    return useQuery({
        queryKey: unitKeys.like(unitId),
        queryFn: () => checkUnitLiked(unitId, user?.id ?? ""),
        enabled:
            options?.enabled !== undefined
                ? options.enabled && !!unitId && !!user?.id
                : !!unitId && !!user?.id,
    });
}

export function useBulkUnitLikes(unitIds: string[], options?: { enabled?: boolean }) {
    const { data: user } = useUser();

    const hasUser = !!user?.id;
    const hasUnits = unitIds.length > 0;

    return useQuery({
        queryKey: unitKeys.bulkLikes(unitIds, user?.id || "anonymous"),
        queryFn: async () => {
            if (!hasUnits || !hasUser) return new Set<string>();
            return getBulkPropertyLikes(unitIds, user!.id);
        },
        enabled:
            options?.enabled !== undefined
                ? options.enabled && hasUnits && hasUser
                : hasUnits && hasUser,
        staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    });
}

export function useToggleUnitLike() {
    const queryClient = useQueryClient();
    const { data: user } = useUser();

    return useMutation({
        mutationFn: async ({ unitId, currentLiked }: { unitId: string; currentLiked: boolean }) => {
            if (!user?.id) {
                throw new Error("User must be authenticated to toggle like");
            }
            return toggleUnitLike(unitId, user.id, currentLiked);
        },
        onMutate: async ({ unitId, currentLiked }) => {
            await queryClient.cancelQueries({ queryKey: unitKeys.like(unitId) });

            const previousValue = queryClient.getQueryData<boolean>(unitKeys.like(unitId));

            // If cache wasn't populated yet, seed it from the caller-provided value.
            if (previousValue === undefined) {
                queryClient.setQueryData<boolean>(unitKeys.like(unitId), currentLiked);
            }

            // Optimistic flip
            queryClient.setQueryData<boolean>(
                unitKeys.like(unitId),
                (old) => !(old ?? currentLiked)
            );

            return { previousValue, unitId };
        },
        onSuccess: (newLikedState, variables) => {
            const { unitId } = variables;

            queryClient.setQueryData<boolean>(unitKeys.like(unitId), newLikedState);

            // Update any cached bulk-like sets
            if (user?.id) {
                queryClient.setQueriesData<Set<string>>(
                    {
                        predicate: (query) => {
                            const key = query.queryKey as readonly unknown[];
                            // Match: ['units','likes','bulk', ...]
                            return (
                                key.length >= 3 &&
                                key[0] === "units" &&
                                key[1] === "likes" &&
                                key[2] === "bulk"
                            );
                        },
                    },
                    (oldData) => {
                        if (!oldData) return oldData;
                        const next = new Set(oldData);
                        if (newLikedState) next.add(unitId);
                        else next.delete(unitId);
                        return next;
                    }
                );
            }
        },
        onError: (_err, variables, context) => {
            const { unitId } = variables;
            if (context?.previousValue !== undefined) {
                queryClient.setQueryData(unitKeys.like(unitId), context.previousValue);
            }
        },
    });
}

// Unit Availability hooks
export function useUnitAvailability(unitId: string) {
    return useQuery({
        queryKey: unitKeys.availabilityDetail(unitId),
        queryFn: () => getUnitAvailabilityByUnitIdClient(unitId),
        enabled: !!unitId,
    });
}

export function useCreateUnitAvailability() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (availabilityData: Omit<UnitAvailabilityInsert, "id" | "created_at">) => {
            return createUnitAvailabilityClient(availabilityData);
        },
        onSuccess: (data) => {
            void queryClient.invalidateQueries({
                queryKey: unitKeys.availabilityDetail(data.unit_id),
            });
        },
    });
}

export function useUpdateUnitAvailability() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            availabilityData,
        }: {
            id: string;
            availabilityData: Partial<
                Omit<UnitAvailabilityInsert, "id" | "created_at" | "unit_id">
            >;
        }) => {
            return updateUnitAvailabilityClient(id, availabilityData);
        },
        onSuccess: (data) => {
            void queryClient.invalidateQueries({
                queryKey: unitKeys.availabilityDetail(data.unit_id),
            });
        },
    });
}

export function useDeleteUnitAvailability() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ unitId }: { unitId: string }) => {
            return deleteUnitAvailabilityByUnitIdClient(unitId);
        },
        onSuccess: (_, variables) => {
            void queryClient.invalidateQueries({
                queryKey: unitKeys.availabilityDetail(variables.unitId),
            });
        },
    });
}
