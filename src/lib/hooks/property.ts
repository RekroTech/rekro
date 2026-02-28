import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { GetPropertiesParams, Property } from "@/types/property.types";
import type { PropertyInsert, UnitInsert } from "@/types/db";
import { getProperties, getPropertyById } from "@/lib/queries";
import { CACHE_STRATEGIES } from "@/lib/config/cache_config";

// Query keys for better cache management
export const propertyKeys = {
    all: ["properties"] as const,
    lists: () => [...propertyKeys.all, "list"] as const,
    list: (filters: Omit<GetPropertiesParams, "offset">) =>
        [...propertyKeys.lists(), filters] as const,
    details: () => [...propertyKeys.all, "detail"] as const,
    detail: (id: string) => [...propertyKeys.details(), id] as const,
};

export function useProperties(
    params: Omit<GetPropertiesParams, "offset"> = {},
    options?: { enabled?: boolean }
) {
    return useInfiniteQuery({
        queryKey: propertyKeys.list(params),
        queryFn: ({ pageParam = 0 }) =>
            getProperties({
                ...params,
                offset: pageParam,
            }),
        getNextPageParam: (lastPage) => lastPage.nextOffset,
        initialPageParam: 0,
        ...CACHE_STRATEGIES.STATIC,
        enabled: options?.enabled ?? true,
    });
}

export function useProperty(id: string) {
    return useQuery<Property>({
        queryKey: propertyKeys.detail(id),
        queryFn: () => getPropertyById(id),
        enabled: !!id,
        ...CACHE_STRATEGIES.STATIC,
    });
}

/**
 * Hook to prefetch property details on hover for instant navigation
 * Call this in onMouseEnter/onTouchStart handlers
 */
export function usePrefetchProperty() {
    const queryClient = useQueryClient();

    return (id: string) => {
        queryClient.prefetchQuery({
            queryKey: propertyKeys.detail(id),
            queryFn: () => getPropertyById(id),
            ...CACHE_STRATEGIES.STATIC,
        });
    };
}

/**
 * Input type for creating a property with units and media
 */
export interface CreatePropertyInput {
    propertyData: Omit<PropertyInsert, "id" | "created_at" | "updated_at" | "images" | "video_url">;
    unitsData: Omit<UnitInsert, "id" | "created_at" | "property_id">[];
    mediaFiles: File[];
}

/**
 * Hook to create a new property
 * Uses API route for complex mutation with file uploads
 */
export function useCreateProperty() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ propertyData, unitsData, mediaFiles }: CreatePropertyInput) => {
            const formData = new FormData();
            formData.append("propertyData", JSON.stringify(propertyData));
            formData.append("unitsData", JSON.stringify(unitsData));

            // Append media files
            mediaFiles.forEach((file) => {
                formData.append("images", file);
            });

            const response = await fetch("/api/property", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Failed to create property");
            }

            return response.json();
        },
        onSuccess: (newProperty) => {
            // Invalidate all property list queries
            queryClient.invalidateQueries({ queryKey: propertyKeys.lists() });
            // Set the new property in cache
            queryClient.setQueryData(propertyKeys.detail(newProperty.id), newProperty);
        },
        onError: (error) => {
            console.error("Failed to create property:", error);
        },
    });
}

/**
 * Input type for updating a property
 */
export interface UpdatePropertyInput {
    propertyId: string;
    propertyData: Partial<
        Omit<PropertyInsert, "id" | "created_at" | "updated_at" | "images" | "created_by">
    >;
    unitsData?: (Omit<UnitInsert, "created_at" | "property_id"> & { id?: string })[];
    mediaFiles?: File[];
    existingImages?: string[];
    deletedUnitIds?: string[];
}

/**
 * Hook to update an existing property
 * Uses API route for complex mutation with file uploads
 */
export function useUpdateProperty() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            propertyId,
            propertyData,
            unitsData = [],
            mediaFiles = [],
            existingImages = [],
            deletedUnitIds = [],
        }: UpdatePropertyInput) => {
            const formData = new FormData();
            formData.append("propertyData", JSON.stringify(propertyData));
            formData.append("unitsData", JSON.stringify(unitsData));
            formData.append("existingImages", JSON.stringify(existingImages));
            formData.append("deletedUnitIds", JSON.stringify(deletedUnitIds));

            // Append media files
            mediaFiles.forEach((file) => {
                if (file.type.startsWith("image/")) {
                    formData.append("images", file);
                } else if (file.type.startsWith("video/")) {
                    formData.append("video", file);
                }
            });

            const response = await fetch(`/api/property/${propertyId}`, {
                method: "PUT",
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Failed to update property");
            }

            return response.json();
        },
        onSuccess: (updatedProperty, { propertyId }) => {
            // Update the specific property in cache
            queryClient.setQueryData(propertyKeys.detail(propertyId), updatedProperty);
            // Invalidate the detail query to ensure fresh data on next fetch
            queryClient.invalidateQueries({ queryKey: propertyKeys.detail(propertyId) });
            // Invalidate all property lists to refetch
            queryClient.invalidateQueries({ queryKey: propertyKeys.lists() });
        },
        onError: (error) => {
            console.error("Failed to update property:", error);
        },
    });
}
