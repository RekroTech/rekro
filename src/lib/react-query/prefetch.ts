/**
 * Prefetching utilities for React Query
 * Use these to prefetch data on the server or in client components
 */

import { QueryClient } from "@tanstack/react-query";
import { propertyKeys } from "./hooks/property/useProperties";
import { applicationKeys } from "./hooks/application/useApplications";
import { getPropertiesClient, getPropertyByIdClient } from "@/services/property.service";
import { GetPropertiesParams } from "@/services/property.service";

/**
 * Prefetch properties list on the server
 * Use in server components or getServerSideProps
 */
export async function prefetchProperties(
    queryClient: QueryClient,
    params: Omit<GetPropertiesParams, "offset"> = {}
) {
    await queryClient.prefetchInfiniteQuery({
        queryKey: propertyKeys.list(params),
        queryFn: ({ pageParam = 0 }) =>
            getPropertiesClient({
                ...params,
                offset: pageParam,
            }),
        initialPageParam: 0,
    });
}

/**
 * Prefetch a single property on the server
 * Use in server components or before navigating to property detail
 */
export async function prefetchProperty(queryClient: QueryClient, propertyId: string) {
    await queryClient.prefetchQuery({
        queryKey: propertyKeys.detail(propertyId),
        queryFn: () => getPropertyByIdClient(propertyId),
    });
}

/**
 * Prefetch applications on the server
 * Requires authentication
 */
export async function prefetchApplications(
    queryClient: QueryClient,
    filters?: { status?: string; propertyId?: string }
) {
    await queryClient.prefetchQuery({
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

            const data = await response.json();
            return data.data;
        },
    });
}

/**
 * Create a query client for server-side rendering
 * Use this in server components to ensure fresh data
 */
export function createServerQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                // On the server, we don't want to refetch
                staleTime: Infinity,
                gcTime: Infinity,
                refetchOnMount: false,
                refetchOnWindowFocus: false,
                refetchOnReconnect: false,
            },
        },
    });
}
