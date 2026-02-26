import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCurrentTimestamp } from "@/lib/utils/dateUtils";
import type { CreateApplicationRequest } from "@/types/application.types";
import type { Application } from "@/types/db";
import { useSessionUser } from "@/lib/hooks/auth";
import { createClient } from "@/lib/supabase/client";

// ============================================================================
// Query Keys
// ============================================================================

export const applicationKeys = {
    all: ["applications"] as const,
    list: () => [...applicationKeys.all, "list"] as const,
    detail: (id: string) => [...applicationKeys.all, "detail", id] as const,
    byPropertyUnit: (propertyId?: string, unitId?: string | null) =>
        [...applicationKeys.all, "byPropertyUnit", propertyId ?? null, unitId ?? null] as const,
    snapshots: () => [...applicationKeys.all, "snapshots"] as const,
    snapshotsList: (filters?: {
        status?: string;
        propertyId?: string;
        unitId?: string | null;
        applicationId?: string;
    }) => [...applicationKeys.snapshots(), "list", filters ?? null] as const,
};

// ============================================================================
// Queries
// ============================================================================

/**
 * Hook to fetch a single application with its snapshots
 *
 * Caller is responsible to pass either:
 * - id: Fetch by application ID
 * - propertyId (+ optional unitId): Fetch by property/unit (returns most recent)
 *
 * Returns the application with snapshots if found, null otherwise
 */
export function useApplication(params?: {
    id?: string;
    propertyId?: string;
    unitId?: string | null;
}) {
    const { data: user } = useSessionUser();

    return useQuery({
        queryKey: params?.id
            ? applicationKeys.detail(params.id)
            : applicationKeys.byPropertyUnit(params?.propertyId, params?.unitId),
        queryFn: async (): Promise<Application | null> => {
            if (!user) {
                throw new Error("Not authenticated");
            }

            const supabase = createClient();
            let query = supabase
                .from("applications")
                .select("*")
                .eq("user_id", user.id);

            // Apply filters based on provided params
            if (params?.id) {
                query = query.eq("id", params.id);
            }
            if (params?.propertyId) {
                query = query.eq("property_id", params.propertyId);
            }
            if (params?.unitId !== undefined) {
                query = query.eq("unit_id", params.unitId);
            }

            // If querying by ID, use single(), otherwise use maybeSingle() with ordering
            if (params?.id) {
                const { data, error } = await query.single();
                if (error) {
                    console.error("Error fetching application:", error);
                    throw new Error(error.message);
                }
                return data as Application;
            } else {
                const { data, error } = await query
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .maybeSingle();
                if (error) {
                    console.error("Error fetching application:", error);
                    throw new Error(error.message);
                }
                return data as Application | null;
            }
        },
        enabled: !!user && !!(params?.id || params?.propertyId),
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
    });
}

/**
 * Hook to fetch all applications for the current user
 * Includes property and unit details for display
 */
export function useApplications() {
    const { data: user } = useSessionUser();

    return useQuery({
        queryKey: applicationKeys.list(),
        queryFn: async () => {
            if (!user) {
                throw new Error("Not authenticated");
            }

            const supabase = createClient();
            const { data, error } = await supabase
                .from("applications")
                .select(`
                    *,
                    properties!inner (
                        id,
                        title,
                        address,
                        images,
                        location
                    ),
                    units!inner (
                        id,
                        name,
                        listing_type,
                        price
                    )
                `)
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Error fetching applications:", error);
                throw new Error(error.message);
            }

            return data || [];
        },
        enabled: !!user,
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
    });
}

// ============================================================================
// Mutations
// ============================================================================

/**
 * Hook to create or update an application - uses API route
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

            const { data } = await response.json();
            return data;
        },
        onSuccess: (data, request) => {
            // Update the cache directly with the new data - no need to invalidate
            const queryKey = applicationKeys.byPropertyUnit(request.propertyId, request.unitId);
            queryClient.setQueryData(queryKey, data);
        },
        onError: (err) => {
            console.error("Failed to save application:", err);
        },
    });
}

/**
 * Hook to create an application snapshot - uses API route
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
            queryClient.invalidateQueries({
                queryKey: applicationKeys.snapshotsList({ applicationId: variables.applicationId }),
            });
            console.log("Snapshot created successfully:", data);
        },
        onError: (err) => {
            console.error("Failed to create snapshot:", err);
        },
    });
}

/**
 * Hook to submit an application - updates status to submitted via API route
 */
export function useSubmitApplication() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (applicationId: string) => {
            const response = await fetch("/api/application/submit", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ applicationId }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to submit application");
            }

            const { data } = await response.json();
            return data;
        },
        onSuccess: (data) => {
            // Update the cache with the new data
            if (data?.id) {
                queryClient.setQueryData(applicationKeys.detail(data.id), data);
                queryClient.setQueryData(
                    applicationKeys.byPropertyUnit(data.property_id, data.unit_id),
                    data
                );
            }
            // Invalidate list queries to refresh
            queryClient.invalidateQueries({
                queryKey: applicationKeys.list(),
            });
        },
        onError: (err) => {
            console.error("Failed to submit application:", err);
        },
    });
}

/**
 * Hook to withdraw an application
 */
export function useWithdrawApplication() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (applicationId: string) => {
            const supabase = createClient();
            const { data, error } = await supabase
                .from("applications")
                .update({
                    status: "withdrawn",
                    updated_at: getCurrentTimestamp()
                })
                .eq("id", applicationId)
                .select()
                .single();

            if (error) {
                console.error("Error withdrawing application:", error);
                throw new Error(error.message);
            }

            return data;
        },
        onSuccess: () => {
            // Invalidate all application queries to refresh the list
            queryClient.invalidateQueries({
                queryKey: applicationKeys.all,
            });
        },
        onError: (err) => {
            console.error("Failed to withdraw application:", err);
        },
    });
}

