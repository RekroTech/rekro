import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { CreateApplicationRequest } from "@/types/application.types";
import { useSessionUser } from "@/lib/react-query/hooks/auth";

// ============================================================================
// Query Keys
// ============================================================================

export const applicationKeys = {
    all: ["applications"] as const,
    list: () => [...applicationKeys.all, "list"] as const,
    detail: (id: string) => [...applicationKeys.all, "detail", id] as const,
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
 * Hook to fetch a single application
 *
 * Caller is responsible to pass either:
 * - id: Fetch by application ID
 * - propertyId (+ optional unitId): Fetch by property/unit (returns most recent)
 *
 * Returns the application if found, null otherwise
 */
export function useApplication(params?: {
    id?: string;
    propertyId?: string;
    unitId?: string | null;
}) {
    const { data: user } = useSessionUser();

    return useQuery({
        queryKey: params?.id ? applicationKeys.detail(params.id) : applicationKeys.list(),
        queryFn: async () => {
            if (!user) {
                throw new Error("Not authenticated");
            }

            const supabase = createClient();
            let query = supabase.from("applications").select("*").eq("user_id", user.id);

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
                return data;
            } else {
                const { data, error } = await query
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .maybeSingle();
                if (error) {
                    console.error("Error fetching application:", error);
                    throw new Error(error.message);
                }
                return data;
            }
        },
        enabled: !!user && !!(params?.id || params?.propertyId),
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
    });
}

/**
 * Hook to fetch snapshots with optional filters
 * Calls Supabase directly - no API route needed for reads!
 *
 * Returns all snapshots if user is admin, otherwise only current user's snapshots.
 *
 * @param filters - Optional filters
 * @param filters.status - Filter by application status
 * @param filters.propertyId - Filter by property ID
 * @param filters.unitId - Filter by unit ID
 * @param filters.applicationId - Filter by specific application ID
 * @returns Query result with snapshots array
 */
export function useApplicationSnapshots(filters?: {
    status?: string;
    propertyId?: string;
    unitId?: string | null;
    applicationId?: string;
}) {
    const { data: user } = useSessionUser();

    return useQuery({
        queryKey: applicationKeys.snapshotsList(filters),
        queryFn: async () => {
            if (!user) {
                throw new Error("Not authenticated");
            }

            const supabase = createClient();
            const isAdmin = user.role === "admin";

            // Build the query with joins to get application data for filtering
            let query = supabase
                .from("application_snapshot")
                .select(
                    `
                    *,
                    applications!inner(
                        user_id,
                        property_id,
                        unit_id,
                        status
                    )
                `
                )
                .order("created_at", { ascending: false });

            // Only filter by user_id if not admin
            if (!isAdmin) {
                query = query.eq("applications.user_id", user.id);
            }

            // Apply filters
            if (filters?.applicationId) {
                query = query.eq("application_id", filters.applicationId);
            }
            if (filters?.status) {
                query = query.eq("applications.status", filters.status);
            }
            if (filters?.propertyId) {
                query = query.eq("applications.property_id", filters.propertyId);
            }
            if (filters?.unitId !== undefined) {
                query = query.eq("applications.unit_id", filters.unitId);
            }

            const { data, error } = await query;

            if (error) {
                console.error("Error fetching snapshots:", error);
                throw new Error(error.message);
            }

            return data || [];
        },
        enabled: !!user,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
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
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: applicationKeys.all });
            const previousApplications = queryClient.getQueryData(applicationKeys.all);
            return { previousApplications };
        },
        onError: (err, _newApplication, context) => {
            if (context?.previousApplications) {
                queryClient.setQueryData(applicationKeys.all, context.previousApplications);
            }
            console.error("Failed to save application:", err);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: applicationKeys.all });
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
