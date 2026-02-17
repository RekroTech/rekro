import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    checkUnitLiked,
    getUnitByPropertyIdClient,
    getUnitsByPropertyIdClient,
    toggleUnitLike,
    getUnitLikesCount,
    getBulkUnitLikesCounts,
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
import { useSessionUser } from "@/lib/react-query/hooks/auth";
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
    likeCounts: () => [...unitKeys.all, "likeCounts"] as const,
    likeCount: (unitId: string) => [...unitKeys.likeCounts(), unitId] as const,
    bulkLikeCounts: (unitIds: string[]) => [...unitKeys.likeCounts(), "bulk", unitIds.sort().join(",")] as const,
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
    const { data: sessionUser } = useSessionUser();

    return useQuery({
        queryKey: unitKeys.like(unitId),
        queryFn: () => checkUnitLiked(unitId, sessionUser?.id ?? ""),
        enabled:
            options?.enabled !== undefined
                ? options.enabled && !!unitId && !!sessionUser?.id
                : !!unitId && !!sessionUser?.id,
    });
}

export function useBulkUnitLikes(unitIds: string[], options?: { enabled?: boolean }) {
    const { data: sessionUser } = useSessionUser();

    const hasUser = !!sessionUser?.id;
    const hasUnits = unitIds.length > 0;

    return useQuery({
        queryKey: unitKeys.bulkLikes(unitIds, sessionUser?.id || "anonymous"),
        queryFn: async () => {
            if (!hasUnits || !hasUser) return new Set<string>();
            return getBulkPropertyLikes(unitIds, sessionUser!.id);
        },
        enabled:
            options?.enabled !== undefined
                ? options.enabled && hasUnits && hasUser
                : hasUnits && hasUser,
    });
}

export function useToggleUnitLike() {
    const queryClient = useQueryClient();
    const { data: sessionUser } = useSessionUser();

    return useMutation({
        mutationFn: async ({
            unitId,
            checked,
        }: {
            unitId: string;
            checked: boolean;
        }) => {
            if (!sessionUser?.id) {
                throw new Error("Unauthorized");
            }
            return toggleUnitLike(unitId, sessionUser.id, checked);
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: unitKeys.like(variables.unitId) });
            queryClient.invalidateQueries({ queryKey: unitKeys.likes() });
            queryClient.invalidateQueries({ queryKey: unitKeys.likeCount(variables.unitId) });
            queryClient.invalidateQueries({ queryKey: unitKeys.likeCounts() });
        },
    });
}

// Unit Like Count Hooks
export function useUnitLikesCount(unitId: string, options?: { enabled?: boolean }) {
    return useQuery({
        queryKey: unitKeys.likeCount(unitId),
        queryFn: () => getUnitLikesCount(unitId),
        enabled: options?.enabled !== undefined ? options.enabled && !!unitId : !!unitId,
    });
}

export function useBulkUnitLikesCounts(unitIds: string[], options?: { enabled?: boolean }) {
    const hasUnits = unitIds.length > 0;

    return useQuery({
        queryKey: unitKeys.bulkLikeCounts(unitIds),
        queryFn: async () => {
            if (!hasUnits) return {};
            return getBulkUnitLikesCounts(unitIds);
        },
        enabled: options?.enabled !== undefined ? options.enabled && hasUnits : hasUnits,
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
