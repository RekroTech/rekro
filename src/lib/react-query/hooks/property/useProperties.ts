import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { PropertyInsert, UnitInsert } from "@/types/db";
import type { GetPropertiesParams } from "@/types/property.types";

import {
    getPropertiesClient,
    createPropertyClient,
    updatePropertyClient,
    getPropertyByIdClient,
} from "@/services/property.service";
import { createUnitClient, deleteUnitClient, upsertUnitsClient } from "@/services/unit.service";
import { uploadPropertyImages } from "@/services/storage.service";

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
            getPropertiesClient({
                ...params,
                offset: pageParam,
            }),
        getNextPageParam: (lastPage) => lastPage.nextOffset,
        initialPageParam: 0,
        // Cache for 2 minutes as property listings don't change frequently
        staleTime: 2 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        enabled: options?.enabled ?? true,
    });
}

export function useProperty(id: string) {
    return useQuery({
        queryKey: propertyKeys.detail(id),
        queryFn: () => getPropertyByIdClient(id),
        enabled: !!id,
        // Cache individual properties for 5 minutes
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });
}

export interface CreatePropertyInput {
    propertyData: Omit<PropertyInsert, "id" | "created_at" | "updated_at" | "images" | "video_url">;
    unitsData: Omit<UnitInsert, "id" | "created_at" | "property_id">[];
    mediaFiles: File[];
}

export function useCreateProperty() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ propertyData, unitsData, mediaFiles }: CreatePropertyInput) => {
            // First create property without images/video to get the propertyId
            const property = await createPropertyClient({
                ...propertyData,
                images: null,
                video_url: null,
            });

            // Create all units for this property
            if (unitsData && unitsData.length > 0) {
                await Promise.all(
                    unitsData.map((unitData) => {
                        return createUnitClient({
                            ...unitData,
                            property_id: property.id,
                        });
                    })
                );
            }

            // Upload photos with propertyId
            let imageUrls: string[] = [];
            if (mediaFiles.length > 0) {
                imageUrls = await uploadPropertyImages(mediaFiles, property.id);
            }

            // Update property with uploaded file URLs
            if (imageUrls.length > 0) {
                return updatePropertyClient(property.id, {
                    images: imageUrls.length > 0 ? imageUrls : null,
                });
            }

            return property;
        },
        onSuccess: (newProperty) => {
            // Invalidate all property list queries
            queryClient.invalidateQueries({ queryKey: propertyKeys.lists() });
            // Optionally set the new property in cache
            queryClient.setQueryData(propertyKeys.detail(newProperty.id), newProperty);
        },
        onError: (error) => {
            console.error("Failed to create property:", error);
        },
    });
}

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
            // Step 1: Delete units marked for deletion
            if (deletedUnitIds.length > 0) {
                await Promise.all(deletedUnitIds.map((id) => deleteUnitClient(id)));
            }

            // Step 2: Handle units - separate create and update operations
            if (unitsData.length > 0) {
                // Separate new units (no id) from existing units (with id)
                const newUnits = unitsData.filter((u) => !u.id);
                const existingUnits = unitsData.filter((u) => u.id);

                // Batch create new units with availability data
                if (newUnits.length > 0) {
                    const unitsToCreate = newUnits.map((unit) => ({
                        listing_type: unit.listing_type || "entire_home",
                        name: unit.name,
                        description: unit.description,
                        price: unit.price,
                        bond_amount: unit.bond_amount,
                        bills_included: unit.bills_included,
                        min_lease: unit.min_lease,
                        max_lease: unit.max_lease,
                        max_occupants: unit.max_occupants,
                        size_sqm: unit.size_sqm,
                        available_from: unit.available_from,
                        available_to: unit.available_to,
                        is_available: unit.is_available ?? true, // Ensure is_available is always set
                        property_id: propertyId,
                    }));

                    await Promise.all(unitsToCreate.map((unitData) => createUnitClient(unitData)));
                }

                // Batch update existing units using upsert (all have ids)
                if (existingUnits.length > 0) {
                    const unitsToUpdate = existingUnits.map((unit) => ({
                        id: unit.id!,
                        listing_type: unit.listing_type || "entire_home",
                        name: unit.name,
                        description: unit.description,
                        price: unit.price,
                        bond_amount: unit.bond_amount,
                        bills_included: unit.bills_included,
                        min_lease: unit.min_lease,
                        max_lease: unit.max_lease,
                        max_occupants: unit.max_occupants,
                        size_sqm: unit.size_sqm,
                        available_from: unit.available_from,
                        available_to: unit.available_to,
                        is_available: unit.is_available ?? true, // Ensure is_available is always set
                        property_id: propertyId,
                    }));

                    await upsertUnitsClient(unitsToUpdate);
                }
            }

            // Step 3: Upload new photos if provided
            let imagePaths: string[] = [...existingImages];
            if (mediaFiles.length > 0) {
                const newImagePaths = await uploadPropertyImages(mediaFiles, propertyId);
                imagePaths = [...imagePaths, ...newImagePaths];
            }

            // Step 4: Update property with file paths
            const fullPropertyData: Partial<
                Omit<PropertyInsert, "id" | "created_at" | "updated_at" | "created_by">
            > = {
                ...propertyData,
            };

            if (mediaFiles.length > 0 || existingImages.length > 0) {
                fullPropertyData.images = imagePaths.length > 0 ? imagePaths : null;
            }

            return updatePropertyClient(propertyId, fullPropertyData);
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
