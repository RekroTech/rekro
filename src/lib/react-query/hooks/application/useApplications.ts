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
        onSuccess: () => {
            // Invalidate applications list to refetch
            queryClient.invalidateQueries({ queryKey: ["applications"] });
        },
    });
}

/**
 * Hook to fetch user's applications
 */
export function useApplications() {
    return useQuery({
        queryKey: ["applications"],
        queryFn: async () => {
            const response = await fetch("/api/application");

            if (!response.ok) {
                throw new Error("Failed to fetch applications");
            }

            const data: ApplicationsResponse = await response.json();
            return data.data;
        },
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
