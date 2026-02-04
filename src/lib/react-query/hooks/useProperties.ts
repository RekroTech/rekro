import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    getPropertiesClient,
    GetPropertiesParams,
    createPropertyClient,
    updatePropertyClient,
    getPropertyByIdClient,
} from "@/services/property.service";
import { uploadPropertyImages } from "@/services/storage.service";
import { PropertyInsert } from "@/types/db";

export function useProperties(params: Omit<GetPropertiesParams, "offset"> = {}) {
    return useInfiniteQuery({
        queryKey: ["properties", params],
        queryFn: ({ pageParam = 0 }) =>
            getPropertiesClient({
                ...params,
                offset: pageParam,
            }),
        getNextPageParam: (lastPage) => lastPage.nextOffset,
        initialPageParam: 0,
    });
}

export function useProperty(id: string) {
    return useQuery({
        queryKey: ["property", id],
        queryFn: () => getPropertyByIdClient(id),
        enabled: !!id,
    });
}

export interface CreatePropertyInput {
    propertyData: Omit<PropertyInsert, "id" | "created_at" | "updated_at" | "images" | "video_url">;
    mediaFiles: File[];
}

export function useCreateProperty() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ propertyData, mediaFiles }: CreatePropertyInput) => {
            // First create property without images/video to get the propertyId
            const property = await createPropertyClient({
                ...propertyData,
                images: null,
                video_url: null,
            });

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
        onSuccess: () => {
            // Invalidate all properties queries to refetch the list
            void queryClient.invalidateQueries({ queryKey: ["properties"] });
        },
    });
}

export interface UpdatePropertyInput {
    propertyId: string;
    propertyData: Partial<
        Omit<PropertyInsert, "id" | "created_at" | "updated_at" | "images" | "created_by">
    >;
    mediaFiles?: File[];
    existingImages?: string[];
}

export function useUpdateProperty() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            propertyId,
            propertyData,
            mediaFiles = [],
            existingImages = [],
        }: UpdatePropertyInput) => {
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
        onSuccess: () => {
            // Invalidate all properties queries to refetch the list
            void queryClient.invalidateQueries({ queryKey: ["properties"] });
        },
    });
}
