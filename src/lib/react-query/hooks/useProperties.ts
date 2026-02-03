import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getPropertiesClient,
    GetPropertiesParams,
    createPropertyClient,
    updatePropertyClient,
} from "@/services/property.service";
import { uploadPropertyImages, uploadPropertyVideo } from "@/services/storage.service";
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

export interface CreatePropertyInput {
    propertyData: Omit<PropertyInsert, "id" | "created_at" | "updated_at" | "images" | "video_url">;
    photoFiles: File[];
    videoFile: File | null;
    userId: string;
}

export function useCreateProperty() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            propertyData,
            photoFiles,
            videoFile,
            userId,
        }: CreatePropertyInput) => {
            // Upload photos
            let imageUrls: string[] = [];
            if (photoFiles.length > 0) {
                imageUrls = await uploadPropertyImages(photoFiles, userId);
            }

            // Upload video
            let videoUrl: string | null = null;
            if (videoFile) {
                videoUrl = await uploadPropertyVideo(videoFile, userId);
            }

            // Create property with uploaded file URLs
            const fullPropertyData: Omit<PropertyInsert, "id" | "created_at" | "updated_at"> = {
                ...propertyData,
                images: imageUrls.length > 0 ? imageUrls : null,
                video_url: videoUrl,
            };

            return createPropertyClient(fullPropertyData);
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
        Omit<
            PropertyInsert,
            "id" | "created_at" | "updated_at" | "images" | "video_url" | "created_by"
        >
    >;
    photoFiles?: File[];
    videoFile?: File | null;
    userId: string;
    existingImages?: string[];
    existingVideoUrl?: string | null;
}

export function useUpdateProperty() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            propertyId,
            propertyData,
            photoFiles = [],
            videoFile,
            userId,
            existingImages = [],
            existingVideoUrl = null,
        }: UpdatePropertyInput) => {
            // Upload new photos if provided
            let imageUrls: string[] = [...existingImages];
            if (photoFiles.length > 0) {
                const newImageUrls = await uploadPropertyImages(photoFiles, userId);
                imageUrls = [...imageUrls, ...newImageUrls];
            }

            // Upload new video if provided
            let videoUrl: string | null = existingVideoUrl;
            if (videoFile !== undefined) {
                if (videoFile) {
                    videoUrl = await uploadPropertyVideo(videoFile, userId);
                } else {
                    videoUrl = null;
                }
            }

            // Update property with file URLs
            const fullPropertyData: Partial<
                Omit<PropertyInsert, "id" | "created_at" | "updated_at" | "created_by">
            > = {
                ...propertyData,
            };

            if (photoFiles.length > 0 || existingImages.length > 0) {
                fullPropertyData.images = imageUrls.length > 0 ? imageUrls : null;
            }

            if (videoFile !== undefined) {
                fullPropertyData.video_url = videoUrl;
            }

            return updatePropertyClient(propertyId, fullPropertyData);
        },
        onSuccess: () => {
            // Invalidate all properties queries to refetch the list
            void queryClient.invalidateQueries({ queryKey: ["properties"] });
        },
    });
}
