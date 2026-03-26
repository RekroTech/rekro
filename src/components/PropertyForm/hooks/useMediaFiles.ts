import { useState, useEffect, useRef } from "react";
import { Property } from "@/types/db";

const moveItem = <T,>(items: T[], fromIndex: number, toIndex: number): T[] => {
    if (
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= items.length ||
        toIndex >= items.length ||
        fromIndex === toIndex
    ) {
        return items;
    }

    const nextItems = [...items];
    const [movedItem] = nextItems.splice(fromIndex, 1);
    if (movedItem === undefined) {
        return items;
    }
    nextItems.splice(toIndex, 0, movedItem);
    return nextItems;
};

export function useMediaFiles(property?: Property) {
    const propertyId = property?.id;
    const prevPropertyIdRef = useRef<string | undefined>(undefined);

    const [mediaFiles, setMediaFiles] = useState<File[]>([]);
    const [existingImages, setExistingImages] = useState<string[]>(() =>
        property?.images && Array.isArray(property.images) ? property.images : []
    );
    const [removedImages, setRemovedImages] = useState<string[]>([]);

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
            setRemovedImages([]);
        } else {
            setExistingImages([]);
            setRemovedImages([]);
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
        const imageFiles = files.filter((file) => file.type.startsWith("image/"));
        setMediaFiles((prev) => [...prev, ...imageFiles]);
    };

    const moveExistingImage = (fromIndex: number, toIndex: number) => {
        setExistingImages((prev) => moveItem(prev, fromIndex, toIndex));
    };

    const moveUploadedFile = (fromIndex: number, toIndex: number) => {
        setMediaFiles((prev) => moveItem(prev, fromIndex, toIndex));
    };

    const resetMedia = () => {
        setMediaFiles([]);
        setExistingImages([]);
        setRemovedImages([]);
    };

    return {
        mediaFiles,
        existingImages,
        removedImages,
        addMediaFiles,
        moveExistingImage,
        moveUploadedFile,
        handleRemoveExistingImage,
        handleRemoveUploadedFile,
        resetMedia,
    };
}
