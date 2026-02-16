/**
 * Application React Query Hooks
 *
 * These hooks use the API routes for server-side operations.
 * For direct client-side Supabase operations, see:
 * - @/services/application.service.ts
 * - @/services/application_snapshot.service.ts
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateApplicationRequest } from "@/types/application.types";
import { Application } from "@/types/db";
import { Inclusion } from "@/components/Property/types";

interface ApplicationResponse {
    success: boolean;
    data: Application;
}

interface ApplicationsResponse {
    success: boolean;
    data: Application[];
}

// Query keys for better cache management
export const applicationKeys = {
    all: ["applications"] as const,
    lists: () => [...applicationKeys.all, "list"] as const,
    list: (filters?: { status?: string; propertyId?: string }) =>
        [...applicationKeys.lists(), filters] as const,
    details: () => [...applicationKeys.all, "detail"] as const,
    detail: (id: string) => [...applicationKeys.details(), id] as const,
    snapshots: () => [...applicationKeys.all, "snapshots"] as const,
    snapshot: (applicationId: string) => [...applicationKeys.snapshots(), applicationId] as const,
};

/**
 * Hook to create or update an application
 * If request.applicationId is provided, it will update the existing application
 * Otherwise, it will create a new one
 */
export function useUpsertApplication() {
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
                throw new Error(error.error || "Failed to save application");
            }

            const data: ApplicationResponse = await response.json();
            return data.data;
        },
        onMutate: async (newApplication) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: applicationKeys.lists() });

            // Snapshot the previous value
            const previousApplications = queryClient.getQueryData(applicationKeys.lists());

            // If updating, optimistically update the existing application
            if (newApplication.applicationId) {
                queryClient.setQueryData<Application[]>(
                    applicationKeys.lists(),
                    (old: Application[] | undefined) => {
                        if (!old) return [];
                        return old.map((app: Application) =>
                            app.id === newApplication.applicationId
                                ? {
                                      ...app,
                                      unit_id: newApplication.unitId || null,
                                      application_type: newApplication.applicationType,
                                      message: newApplication.message || null,
                                      move_in_date: newApplication.moveInDate || null,
                                      rental_duration: newApplication.rentalDuration ? parseInt(newApplication.rentalDuration, 10) : null,
                                      proposed_rent: newApplication.proposedRent ? parseFloat(newApplication.proposedRent) : null,
                                      total_rent: newApplication.totalRent || null,
                                      inclusions: newApplication.inclusions as Inclusion[],
                                      occupancy_type: newApplication.occupancyType,
                                      updated_at: new Date().toISOString(),
                                  }
                                : app
                        );
                    }
                );
            } else {
                // Optimistically add new application
                queryClient.setQueryData<Application[]>(
                    applicationKeys.lists(),
                    (old = []) => {
                        const optimisticApp: Application = {
                            id: `temp-${Date.now()}`,
                            user_id: "",
                            property_id: newApplication.propertyId,
                            unit_id: newApplication.unitId || null,
                            application_type: newApplication.applicationType,
                            status: "submitted",
                            message: newApplication.message || null,
                            submitted_at: new Date().toISOString(),
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                            group_id: null,
                            move_in_date: newApplication.moveInDate || null,
                            rental_duration: newApplication.rentalDuration ? parseInt(newApplication.rentalDuration, 10) : null,
                            proposed_rent: newApplication.proposedRent ? parseFloat(newApplication.proposedRent) : null,
                            total_rent: newApplication.totalRent || null,
                            inclusions: newApplication.inclusions,
                            occupancy_type: newApplication.occupancyType,
                        };
                        return [optimisticApp, ...old];
                    }
                );
            }

            return { previousApplications };
        },
        onError: (err, _newApplication, context) => {
            // Rollback on error
            if (context?.previousApplications) {
                queryClient.setQueryData(applicationKeys.lists(), context.previousApplications);
            }
            console.error("Failed to save application:", err);
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
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
    });
}

/**
 * Hook to check if user has already applied to a property/unit
 * Returns the existing application if found, null otherwise
 */
export function useHasApplied(propertyId: string, unitId?: string | null) {
    const { data: applications } = useApplications();

    if (!applications) {
        return null;
    }

    return applications.find((app) => {
        if (unitId) {
            return app.property_id === propertyId && app.unit_id === unitId;
        }
        return app.property_id === propertyId && !app.unit_id;
    }) || null;
}


/**
 * Hook to create an application snapshot
 * Creates an immutable snapshot of the application with user profile data
 *
 * @example
 * const { mutate: createSnapshot, isPending } = useCreateSnapshot();
 *
 * // Create a snapshot
 * createSnapshot({
 *   applicationId: "uuid",
 *   note: "Initial submission snapshot"
 * });
 */
export function useCreateSnapshot() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ applicationId, note }: { applicationId: string; note?: string }) => {
            const response = await fetch("/api/application/snapshot", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ applicationId, note }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to create snapshot");
            }

            const data = await response.json();
            return data.data;
        },
        onSuccess: (data, variables) => {
            // Invalidate snapshots query for this application
            queryClient.invalidateQueries({
                queryKey: applicationKeys.snapshot(variables.applicationId)
            });
            console.log("Snapshot created successfully:", data);
        },
        onError: (err) => {
            console.error("Failed to create snapshot:", err);
        },
    });
}

/**
 * Hook to fetch snapshots for an application
 * Returns all snapshots in descending order (newest first)
 *
 * @example
 * const { data: snapshots, isLoading } = useApplicationSnapshots(applicationId);
 */
export function useApplicationSnapshots(applicationId: string | null) {
    return useQuery({
        queryKey: applicationKeys.snapshot(applicationId || ""),
        queryFn: async () => {
            if (!applicationId) return [];

            const response = await fetch(`/api/application/snapshot?applicationId=${applicationId}`);

            if (!response.ok) {
                throw new Error("Failed to fetch snapshots");
            }

            const data = await response.json();
            return data.data;
        },
        enabled: !!applicationId,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000,
    });
}

/**
 * Hook to fetch a single application by id.
 * This avoids fetching the full list and filtering client-side.
 */
export function useApplication(applicationId: string | null) {
    return useQuery({
        queryKey: applicationKeys.detail(applicationId || ""),
        queryFn: async () => {
            if (!applicationId) {
                throw new Error("Missing applicationId");
            }

            const response = await fetch(`/api/application?applicationId=${applicationId}`);
            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err?.error || "Failed to fetch application");
            }

            const data: ApplicationResponse = await response.json();
            return data.data;
        },
        enabled: !!applicationId,
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
    });
}
