import { useState, useEffect, useRef } from "react";
import { Property } from "@/types/db";

export function useMediaFiles(property?: Property) {
    const propertyId = property?.id;
    const prevPropertyIdRef = useRef<string | undefined>(undefined);

    const [mediaFiles, setMediaFiles] = useState<File[]>([]);
    const [existingImages, setExistingImages] = useState<string[]>(() =>
        property?.images && Array.isArray(property.images) ? property.images : []
    );
    const [removedImages, setRemovedImages] = useState<string[]>([]);
    const [existingVideoUrl, setExistingVideoUrl] = useState<string | null>(
        () => property?.video_url || null
    );
    const [removeVideo, setRemoveVideo] = useState(false);

    useEffect(() => {
        // Check if propertyId has actually changed
        if (prevPropertyIdRef.current === propertyId) {
            return; // No change, skip update
        }

        prevPropertyIdRef.current = propertyId;

        if (property) {
            setExistingImages(
                property.images && Array.isArray(property.images) ? property.images : []
            );
            setExistingVideoUrl(property.video_url || null);
            setRemovedImages([]);
            setRemoveVideo(false);
        } else {
            setExistingImages([]);
            setExistingVideoUrl(null);
            setRemovedImages([]);
            setRemoveVideo(false);
        }
        setMediaFiles([]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [propertyId]);

    const handleRemoveExistingImage = (imageUrl: string) => {
        setRemovedImages((prev) => [...prev, imageUrl]);
        setExistingImages((prev) => prev.filter((img) => img !== imageUrl));
    };

    const handleRemoveUploadedFile = (index: number) => {
        setMediaFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const addMediaFiles = (files: File[]) => {
        setMediaFiles((prev) => [...prev, ...files]);
    };

    const resetMedia = () => {
        setMediaFiles([]);
        setExistingImages([]);
        setRemovedImages([]);
        setExistingVideoUrl(null);
        setRemoveVideo(false);
    };

    return {
        mediaFiles,
        existingImages,
        removedImages,
        existingVideoUrl,
        removeVideo,
        addMediaFiles,
        handleRemoveExistingImage,
        handleRemoveUploadedFile,
        resetMedia,
    };
}
