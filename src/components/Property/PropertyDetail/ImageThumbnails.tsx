import { PropertyMedia } from "@/components/common";
import { useState } from "react";

interface ImageThumbnailsProps {
    images: string[];
    title: string;
    selectedIndex: number;
    onSelect: (index: number) => void;
    thumbnailsPerPage?: number;
}

export function ImageThumbnails({
    images,
    title,
    selectedIndex,
    onSelect,
    thumbnailsPerPage = 8,
}: ImageThumbnailsProps) {
    const [thumbnailStartIndex, setThumbnailStartIndex] = useState(0);

    const isPlaceholder = images[0] === "/window.svg";

    if (images.length <= 1 || isPlaceholder) {
        return null;
    }

    const handlePrevious = () => {
        setThumbnailStartIndex((prev) => Math.max(0, prev - thumbnailsPerPage));
    };

    const handleNext = () => {
        setThumbnailStartIndex((prev) =>
            Math.min(images.length - thumbnailsPerPage, prev + thumbnailsPerPage)
        );
    };

    const showPrevious = images.length > thumbnailsPerPage && thumbnailStartIndex > 0;
    const showNext =
        images.length > thumbnailsPerPage &&
        thumbnailStartIndex + thumbnailsPerPage < images.length;

    return (
        <div className="relative flex items-center gap-2">
            {showPrevious && (
                <button
                    onClick={handlePrevious}
                    className="flex-shrink-0 bg-white hover:bg-gray-50 text-gray-800 p-2 rounded-full shadow-lg transition-all border border-gray-200"
                    aria-label="Previous thumbnails"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                        />
                    </svg>
                </button>
            )}

            <div className="flex-1 grid grid-cols-6 md:grid-cols-8 gap-2">
                {images
                    .slice(thumbnailStartIndex, thumbnailStartIndex + thumbnailsPerPage)
                    .map((img, relativeIndex) => {
                        const index = thumbnailStartIndex + relativeIndex;
                        const isSelected = selectedIndex === index;

                        return (
                            <button
                                key={`${img}-${index}`}
                                type="button"
                                onClick={() => onSelect(index)}
                                className={`relative block h-16 md:h-20 w-full rounded-lg overflow-hidden border-2 transition-all ${
                                    isSelected
                                        ? "border-primary-500 ring-2 ring-primary-200"
                                        : "border-gray-200 hover:border-gray-300"
                                }`}
                                aria-label={`Select image ${index + 1}`}
                                aria-current={isSelected ? "true" : "false"}
                            >
                                <PropertyMedia
                                    src={img}
                                    alt={`${title} thumbnail ${index + 1}`}
                                    fill
                                    sizes="80px"
                                    loading="lazy"
                                    objectFit="cover"
                                />
                            </button>
                        );
                    })}
            </div>

            {showNext && (
                <button
                    onClick={handleNext}
                    className="flex-shrink-0 bg-white hover:bg-gray-50 text-gray-800 p-2 rounded-full shadow-lg transition-all border border-gray-200"
                    aria-label="Next thumbnails"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                        />
                    </svg>
                </button>
            )}
        </div>
    );
}
