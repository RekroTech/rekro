import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { GetPropertiesParams, Property } from "@/types/property.types";
import type { PropertyInsert, UnitInsert } from "@/types/db";
import { getProperties, getPropertyById } from "@/lib/queries";
import { CACHE_STRATEGIES } from "@/lib/config/cache_config";
import { useRoles } from "@/lib/hooks/roles";

// Query keys for better cache management
export const propertyKeys = {
    all: ["properties"] as const,
    lists: () => [...propertyKeys.all, "list"] as const,
    list: (filters: Omit<GetPropertiesParams, "offset">) =>
        [...propertyKeys.lists(), filters] as const,
    details: () => [...propertyKeys.all, "detail"] as const,
    detail: (id: string, isAdmin = false) =>
        [...propertyKeys.details(), id, isAdmin ? "admin" : "public"] as const,
};

export function useProperties(
    params: Omit<GetPropertiesParams, "offset"> = {},
    options?: { enabled?: boolean }
) {
    const { isAdmin } = useRoles();
    const effectiveParams = {
        ...params,
        isAdmin: params.isAdmin ?? isAdmin,
    };

    return useInfiniteQuery({
        queryKey: propertyKeys.list(effectiveParams),
        queryFn: ({ pageParam = 0 }) =>
            getProperties({
                ...effectiveParams,
                offset: pageParam,
            }),
        getNextPageParam: (lastPage) => lastPage.nextOffset,
        initialPageParam: 0,
        ...CACHE_STRATEGIES.STATIC,
        enabled: options?.enabled ?? true,
    });
}

export function useProperty(id: string) {
    const { isAdmin } = useRoles();

    return useQuery<Property>({
        queryKey: propertyKeys.detail(id, isAdmin),
        queryFn: () => getPropertyById(id, isAdmin),
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
            queryKey: propertyKeys.detail(id, false),
            queryFn: () => getPropertyById(id, false),
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

            const createResponse = await fetch("/api/property", {
                method: "POST",
                body: formData,
            });

            if (!createResponse.ok) {
                const error = await createResponse.json();
                throw new Error(error.error || error.message || "Failed to create property");
            }

            const createdProperty = await createResponse.json();

            // Upload media in a separate request so property save is not blocked by storage I/O.
            if (mediaFiles.length > 0) {
                const mediaFormData = new FormData();
                mediaFiles.forEach((file) => {
                    if (file.type.startsWith("image/")) {
                        mediaFormData.append("images", file);
                    }
                });

                if (mediaFormData.getAll("images").length > 0) {
                    void fetch(`/api/property/${createdProperty.id}/media`, {
                        method: "POST",
                        body: mediaFormData,
                    })
                        .then(async (response) => {
                            if (!response.ok) {
                                const error = await response.json().catch(() => ({}));
                                throw new Error(
                                    error.error || error.message || "Failed to upload property images"
                                );
                            }

                            const result = await response.json();
                            if (result?.property?.id) {
                                queryClient.setQueryData(
                                    propertyKeys.detail(result.property.id, false),
                                    result.property
                                );
                                queryClient.invalidateQueries({ queryKey: propertyKeys.lists() });
                            }
                        })
                        .catch((error) => {
                            console.error(
                                `Property ${createdProperty.id} created, but async media upload failed:` ,
                                error
                            );
                        });
                }
            }

            return createdProperty;
        },
        onSuccess: (newProperty) => {
            // Invalidate all property list queries
            queryClient.invalidateQueries({ queryKey: propertyKeys.lists() });
            // Set the new property in cache
            queryClient.setQueryData(propertyKeys.detail(newProperty.id, false), newProperty);
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
    removedImages?: string[];
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
            removedImages = [],
            deletedUnitIds = [],
        }: UpdatePropertyInput) => {
            const formData = new FormData();
            formData.append("propertyData", JSON.stringify(propertyData));
            formData.append("unitsData", JSON.stringify(unitsData));
            formData.append("existingImages", JSON.stringify(existingImages));
            formData.append("removedImages", JSON.stringify(removedImages));
            formData.append("deletedUnitIds", JSON.stringify(deletedUnitIds));

            // Append media files
            mediaFiles.forEach((file) => {
                if (file.type.startsWith("image/")) {
                    formData.append("images", file);
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
            queryClient.setQueryData(propertyKeys.detail(propertyId, false), updatedProperty);
            // Invalidate the detail query to ensure fresh data on next fetch
            queryClient.invalidateQueries({ queryKey: propertyKeys.details() });
            // Invalidate all property lists to refetch
            queryClient.invalidateQueries({ queryKey: propertyKeys.lists() });
        },
        onError: (error) => {
            console.error("Failed to update property:", error);
        },
    });
}

/**
 * Hook to hard-delete a property and all its units/storage
 */
export function useDeleteProperty() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (propertyId: string) => {
            const response = await fetch(`/api/property/${propertyId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Failed to delete property");
            }

            return response.json();
        },
        onSuccess: (_, propertyId) => {
            queryClient.removeQueries({ queryKey: propertyKeys.detail(propertyId, false) });
            queryClient.removeQueries({ queryKey: propertyKeys.detail(propertyId, true) });
            queryClient.invalidateQueries({ queryKey: propertyKeys.lists() });
        },
        onError: (error) => {
            console.error("Failed to delete property:", error);
        },
    });
}

