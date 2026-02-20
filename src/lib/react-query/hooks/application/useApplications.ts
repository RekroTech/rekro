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
    list: (filters?: { status?: string; propertyId?: string }) =>
        [...applicationKeys.all, "list", filters ?? null] as const,
    detail: (id: string) => [...applicationKeys.all, "detail", id] as const,
    snapshot: (applicationId: string) =>
        [...applicationKeys.all, "snapshot", applicationId] as const,
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
        onMutate: async () => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: applicationKeys.all });

            // Snapshot the previous value
            const previousApplications = queryClient.getQueryData(applicationKeys.all);

            return { previousApplications };
        },
        onError: (err, _newApplication, context) => {
            // Rollback on error
            if (context?.previousApplications) {
                queryClient.setQueryData(applicationKeys.all, context.previousApplications);
            }
            console.error("Failed to save application:", err);
        },
        onSettled: () => {
            // Refetch after error or success
            queryClient.invalidateQueries({ queryKey: applicationKeys.all });
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
export function useApplication(propertyId: string, unitId?: string | null) {
    return useQuery({
        queryKey: applicationKeys.list(),
        queryFn: async () => {
            const response = await fetch("/api/application");
            if (!response.ok) {
                throw new Error("Failed to fetch applications");
            }
            const data: ApplicationsResponse = await response.json();
            return data.data;
        },
        select: (applications) => {
            return (
                applications.find((app) => {
                    if (unitId) {
                        return app.property_id === propertyId && app.unit_id === unitId;
                    }
                    return app.property_id === propertyId && !app.unit_id;
                }) || null
            );
        },
        // Keep same caching characteristics as useApplications
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
        enabled: !!propertyId,
    }).data ?? null;
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
                queryKey: applicationKeys.snapshot(variables.applicationId),
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
export function useApplicationById(applicationId: string | null) {
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
