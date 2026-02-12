import { Visual, Icon } from "@/components/common";
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
                    className="hidden sm:inline-flex flex-shrink-0 bg-white hover:bg-gray-50 text-gray-800 p-1.5 sm:p-2 rounded-full shadow-lg transition-all border border-gray-200 active:scale-95"
                    aria-label="Previous thumbnails"
                >
                    <Icon name="chevron-left" className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
            )}

            <div
                className={
                    "flex-1 " +
                    "flex flex-nowrap gap-1.5 overflow-x-auto whitespace-nowrap py-0.5 " +
                    "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden " +
                    "sm:grid sm:grid-cols-6 md:grid-cols-8 sm:gap-2 sm:overflow-x-visible sm:whitespace-normal sm:py-0"
                }
            >
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
                                className={`relative block h-14 sm:h-16 md:h-20 w-20 sm:w-full rounded-lg overflow-hidden border-2 transition-all touch-manipulation active:scale-95 flex-shrink-0 sm:flex-shrink ${
                                    isSelected
                                        ? "border-primary-500 ring-2 ring-primary-200"
                                        : "border-border hover:border-text-muted"
                                }`}
                                aria-label={`Select image ${index + 1}`}
                                aria-current={isSelected ? "true" : "false"}
                            >
                                <Visual
                                    src={img}
                                    alt={`${title} thumbnail ${index + 1}`}
                                    fill
                                    sizes="(max-width: 640px) 80px, (max-width: 768px) 100px, 120px"
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
                    className="hidden sm:inline-flex flex-shrink-0 bg-card hover:bg-surface-muted text-foreground p-1.5 sm:p-2 rounded-full shadow-lg transition-all border border-border active:scale-95"
                    aria-label="Next thumbnails"
                >
                    <Icon name="chevron-right" className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
            )}
        </div>
    );
}
