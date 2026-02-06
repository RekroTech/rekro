import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    createPropertyShareClient,
    getPropertySharesByUnitClient,
    getPropertySharesCountClient,
} from "@/services/property_share.service";
import { PropertyShareInsert } from "@/types/db";

export function usePropertyShares(unitId: string) {
    return useQuery({
        queryKey: ["property-shares", unitId],
        queryFn: () => getPropertySharesByUnitClient(unitId),
        enabled: !!unitId,
    });
}

export function usePropertySharesCount(unitId: string) {
    return useQuery({
        queryKey: ["property-shares-count", unitId],
        queryFn: () => getPropertySharesCountClient(unitId),
        enabled: !!unitId,
    });
}

export function useCreatePropertyShare() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (shareData: Omit<PropertyShareInsert, "id" | "created_at">) => {
            return createPropertyShareClient(shareData);
        },
        onSuccess: (_, variables) => {
            // Invalidate shares queries for this unit
            void queryClient.invalidateQueries({
                queryKey: ["property-shares", variables.unit_id],
            });
            void queryClient.invalidateQueries({
                queryKey: ["property-shares-count", variables.unit_id],
            });
        },
    });
}
