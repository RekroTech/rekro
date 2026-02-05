import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    checkUnitLiked,
    getUnitByPropertyIdClient,
    getUnitsByPropertyIdClient,
    toggleUnitLike,
} from "@/services/unit.service";
import {
    createUnitAvailabilityClient,
    deleteUnitAvailabilityByUnitIdClient,
    getUnitAvailabilityByUnitIdClient,
    updateUnitAvailabilityClient,
} from "@/services/unit_availability.service";
import { UnitAvailabilityInsert } from "@/types/db";

export function useUnit(propertyId: string) {
    return useQuery({
        queryKey: ["unit", propertyId],
        queryFn: () => getUnitByPropertyIdClient(propertyId),
        enabled: !!propertyId,
    });
}

export function useUnits(propertyId: string) {
    return useQuery({
        queryKey: ["units", propertyId],
        queryFn: () => getUnitsByPropertyIdClient(propertyId),
        enabled: !!propertyId,
    });
}

// Unit Likes Hooks
export function useUnitLike(unitId: string) {
    return useQuery({
        queryKey: ["unit-like", unitId],
        queryFn: () => checkUnitLiked(unitId),
        enabled: !!unitId,
    });
}

export function useToggleUnitLike() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (unitId: string) => {
            return toggleUnitLike(unitId);
        },
        onSuccess: (isLiked, unitId) => {
            // Invalidate the specific unit like query
            void queryClient.invalidateQueries({ queryKey: ["unit-like", unitId] });
        },
    });
}

// Unit Availability hooks
export function useUnitAvailability(unitId: string) {
    return useQuery({
        queryKey: ["unit-availability", unitId],
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
                queryKey: ["unit-availability", data.unit_id],
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
                queryKey: ["unit-availability", data.unit_id],
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
                queryKey: ["unit-availability", variables.unitId],
            });
        },
    });
}
