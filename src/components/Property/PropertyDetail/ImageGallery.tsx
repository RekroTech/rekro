import { Icon, Visual } from "@/components/common";
import { useState } from "react";

interface ImageGalleryProps {
    images: string[];
    title: string;
    selectedIndex: number;
    onIndexChange: (index: number) => void;
    thumbnailsPerPage?: number;
}

export function ImageGallery({
    images,
    title,
    selectedIndex,
    onIndexChange,
    thumbnailsPerPage = 8,
}: ImageGalleryProps) {
    const [thumbnailStartIndex, setThumbnailStartIndex] = useState(0);

    const handlePrevious = () => {
        onIndexChange(selectedIndex === 0 ? images.length - 1 : selectedIndex - 1);
    };

    const handleNext = () => {
        onIndexChange(selectedIndex === images.length - 1 ? 0 : selectedIndex + 1);
    };

    const handleThumbnailPrevious = () => {
        setThumbnailStartIndex((prev) => Math.max(0, prev - thumbnailsPerPage));
    };

    const handleThumbnailNext = () => {
        setThumbnailStartIndex((prev) =>
            Math.min(images.length - thumbnailsPerPage, prev + thumbnailsPerPage)
        );
    };

    // Safety check for empty images array
    if (!images.length || !images[selectedIndex]) {
        return null;
    }

    const isPlaceholder = images[0] === "/window.svg";
    const showPreviousThumbs = images.length > thumbnailsPerPage && thumbnailStartIndex > 0;
    const showNextThumbs =
        images.length > thumbnailsPerPage &&
        thumbnailStartIndex + thumbnailsPerPage < images.length;

    return (
        <>
            <div className="bg-gray-100 rounded-lg overflow-hidden mb-2 sm:mb-4 group relative aspect-video touch-manipulation">
                <Visual
                    src={images[selectedIndex]}
                    alt={`${title} - Image ${selectedIndex + 1}`}
                    fill
                    sizes="(max-width: 1024px) 100vw, 66vw"
                    priority
                    showBadge={false}
                />

                {/* Image Counter */}
                {images.length > 1 && (
                    <div className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-black/60 text-white px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium backdrop-blur-sm">
                        {selectedIndex + 1} / {images.length}
                    </div>
                )}

                {/* Navigation Arrows - Always visible on mobile, hidden on hover for desktop */}
                {images.length > 1 && (
                    <>
                        <button
                            onClick={handlePrevious}
                            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-2 sm:p-3 rounded-full shadow-lg transition-all sm:opacity-0 sm:group-hover:opacity-100 active:scale-95"
                            aria-label="Previous image"
                        >
                            <Icon name="chevron-left" className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>

                        <button
                            onClick={handleNext}
                            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-2 sm:p-3 rounded-full shadow-lg transition-all sm:opacity-0 sm:group-hover:opacity-100 active:scale-95"
                            aria-label="Next image"
                        >
                            <Icon name="chevron-right" className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                    </>
                )}
            </div>

            {/* Image Thumbnails */}
            {images.length > 1 && !isPlaceholder && (
                <div className="relative flex items-center gap-2">
                    {showPreviousThumbs && (
                        <button
                            onClick={handleThumbnailPrevious}
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
                                        onClick={() => onIndexChange(index)}
                                        className={`relative block h-14 sm:h-16 md:h-20 w-20 sm:w-full rounded-lg overflow-hidden border-2 transition-all touch-manipulation active:scale-95 flex-shrink-0 sm:flex-shrink ${
                                            isSelected
                                                ? "border-primary-500"
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

                    {showNextThumbs && (
                        <button
                            onClick={handleThumbnailNext}
                            className="hidden sm:inline-flex flex-shrink-0 bg-card hover:bg-surface-muted text-foreground p-1.5 sm:p-2 rounded-full shadow-lg transition-all border border-border active:scale-95"
                            aria-label="Next thumbnails"
                        >
                            <Icon name="chevron-right" className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                    )}
                </div>
            )}
        </>
    );
}
