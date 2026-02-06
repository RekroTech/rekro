import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { PropertyInsert, UnitInsert, UnitAvailabilityInsert } from "@/types/db";
import type { GetPropertiesParams } from "@/types/property.types";

import {
    getPropertiesClient,
    createPropertyClient,
    updatePropertyClient,
    getPropertyByIdClient,
} from "@/services/property.service";
import {
    createUnitClient,
    updateUnitClient,
    getUnitsByPropertyIdClient,
} from "@/services/unit.service";
import {
    createUnitAvailabilityClient,
    updateUnitAvailabilityClient,
    getUnitAvailabilityByUnitIdClient,
} from "@/services/unit_availability.service";
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

export function useProperties(params: Omit<GetPropertiesParams, "offset"> = {}) {
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
    availabilityData: Omit<UnitAvailabilityInsert, "id" | "created_at" | "unit_id">[];
    mediaFiles: File[];
}

export function useCreateProperty() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            propertyData,
            unitsData,
            availabilityData,
            mediaFiles,
        }: CreatePropertyInput) => {
            // First create property without images/video to get the propertyId
            const property = await createPropertyClient({
                ...propertyData,
                images: null,
                video_url: null,
            });

            // Create all units for this property
            if (unitsData && unitsData.length > 0) {
                const createdUnits = await Promise.all(
                    unitsData.map((unitData) => {
                        return createUnitClient({
                            ...unitData,
                            property_id: property.id,
                        });
                    })
                );

                // Create availability records for each unit
                if (availabilityData && availabilityData.length > 0) {
                    await Promise.all(
                        createdUnits.map((unit, index) => {
                            const availability = availabilityData[index];
                            if (availability) {
                                return createUnitAvailabilityClient({
                                    ...availability,
                                    unit_id: unit.id,
                                });
                            }
                            return Promise.resolve();
                        })
                    );
                }
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
    unitsData?: Omit<UnitInsert, "id" | "created_at" | "property_id">[];
    availabilityData?: Omit<UnitAvailabilityInsert, "id" | "created_at" | "unit_id">[];
    mediaFiles?: File[];
    existingImages?: string[];
}

export function useUpdateProperty() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            propertyId,
            propertyData,
            unitsData = [],
            availabilityData = [],
            mediaFiles = [],
            existingImages = [],
        }: UpdatePropertyInput) => {
            // Handle units creation/update if unitsData is provided
            if (unitsData && unitsData.length > 0) {
                // Get all existing units for this property
                const existingUnits = await getUnitsByPropertyIdClient(propertyId);

                // Update existing units and create new ones
                for (let i = 0; i < unitsData.length; i++) {
                    const unitData = unitsData[i];
                    const existingUnit = existingUnits[i];
                    const availability = availabilityData[i];

                    if (existingUnit) {
                        // Update existing unit (unitData should be defined since we're iterating unitsData)
                        if (unitData) {
                            await updateUnitClient(existingUnit.id, unitData);
                        }

                        // Update or create availability record for this unit
                        if (availability) {
                            const existingAvailability = await getUnitAvailabilityByUnitIdClient(
                                existingUnit.id
                            );

                            if (existingAvailability) {
                                // Update existing availability
                                await updateUnitAvailabilityClient(
                                    existingAvailability.id,
                                    availability
                                );
                            } else {
                                // Create new availability record
                                await createUnitAvailabilityClient({
                                    ...availability,
                                    unit_id: existingUnit.id,
                                });
                            }
                        }
                    } else if (unitData) {
                        // Create new unit (this happens when bedroom count increased)
                        const newUnit = await createUnitClient({
                            ...unitData,
                            property_id: propertyId,
                            listing_type: unitData.listing_type || "entire_home",
                        });

                        // Create availability record for new unit
                        if (availability) {
                            await createUnitAvailabilityClient({
                                ...availability,
                                unit_id: newUnit.id,
                            });
                        }
                    }
                }
            }

            // Upload new photos if provided
            let imagePaths: string[] = [...existingImages];
            if (mediaFiles.length > 0) {
                const newImagePaths = await uploadPropertyImages(mediaFiles, propertyId);
                imagePaths = [...imagePaths, ...newImagePaths];
            }

            // Update property with file paths
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
            // Invalidate all property lists to refetch
            queryClient.invalidateQueries({ queryKey: propertyKeys.lists() });
        },
        onError: (error) => {
            console.error("Failed to update property:", error);
        },
    });
}
