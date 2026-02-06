import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateApplicationRequest } from "@/types/application.types";
import type { ApplicationWithDetails } from "@/services/application.service";

interface ApplicationResponse {
    success: boolean;
    data: ApplicationWithDetails;
}

interface ApplicationsResponse {
    success: boolean;
    data: ApplicationWithDetails[];
}

// Query keys for better cache management
export const applicationKeys = {
    all: ["applications"] as const,
    lists: () => [...applicationKeys.all, "list"] as const,
    list: (filters?: { status?: string; propertyId?: string }) =>
        [...applicationKeys.lists(), filters] as const,
    details: () => [...applicationKeys.all, "detail"] as const,
    detail: (id: string) => [...applicationKeys.details(), id] as const,
};

/**
 * Hook to submit a new application
 */
export function useSubmitApplication() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (request: CreateApplicationRequest) => {
            const response = await fetch("/api/application", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(request),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to submit application");
            }

            const data: ApplicationResponse = await response.json();
            return data.data;
        },
        onMutate: async (newApplication) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: applicationKeys.lists() });

            // Snapshot the previous value
            const previousApplications = queryClient.getQueryData(applicationKeys.lists());

            // Optimistically update to the new value
            queryClient.setQueryData<ApplicationWithDetails[]>(
                applicationKeys.lists(),
                (old = []) => {
                    // Create optimistic application
                    const optimisticApp: ApplicationWithDetails = {
                        id: `temp-${Date.now()}`,
                        user_id: "",
                        property_id: newApplication.propertyId,
                        unit_id: newApplication.unitId || null,
                        application_type: newApplication.applicationType,
                        status: "submitted",
                        message: newApplication.formData.message || null,
                        submitted_at: new Date().toISOString(),
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        group_id: null,
                        details: null,
                    };
                    return [optimisticApp, ...old];
                }
            );

            return { previousApplications };
        },
        onError: (err, _newApplication, context) => {
            // Rollback on error
            if (context?.previousApplications) {
                queryClient.setQueryData(applicationKeys.lists(), context.previousApplications);
            }
            console.error("Failed to submit application:", err);
        },
        onSettled: () => {
            // Refetch after error or success
            queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
        },
    });
}

/**
 * Hook to fetch user's applications with optional filters
 */
export function useApplications(filters?: { status?: string; propertyId?: string }) {
    return useQuery({
        queryKey: applicationKeys.list(filters),
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters?.status) params.append("status", filters.status);
            if (filters?.propertyId) params.append("propertyId", filters.propertyId);

            const url = `/api/application${params.toString() ? `?${params.toString()}` : ""}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error("Failed to fetch applications");
            }

            const data: ApplicationsResponse = await response.json();
            return data.data;
        },
        // Cache for 1 minute since applications don't change frequently
        staleTime: 1 * 60 * 1000,
        gcTime: 5 * 60 * 1000,
    });
}

/**
 * Hook to check if user has already applied to a property/unit
 */
export function useHasApplied(propertyId: string, unitId?: string | null) {
    const { data: applications } = useApplications();

    if (!applications) {
        return false;
    }

    return applications.some((app) => {
        if (unitId) {
            return app.property_id === propertyId && app.unit_id === unitId;
        }
        return app.property_id === propertyId && !app.unit_id;
    });
}
