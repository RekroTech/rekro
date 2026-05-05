import { useState } from "react";
import { clsx } from "clsx";
import { ChevronLeft, ChevronRight, Expand } from "lucide-react";
import { Button, Icon, Visual } from "@/components/common";
import type { GalleryItem } from "@/types/property.types";

interface ImageGalleryProps {
    items: GalleryItem[];
    title?: string;
    thumbnailsPerPage?: number;
}

export function ImageGallery({
    items,
    title = "Property",
    thumbnailsPerPage = 8,
}: ImageGalleryProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [thumbnailStartIndex, setThumbnailStartIndex] = useState(0);

    const handlePrevious = () => {
        setSelectedIndex(selectedIndex === 0 ? items.length - 1 : selectedIndex - 1);
    };

    const handleNext = () => {
        setSelectedIndex(selectedIndex === items.length - 1 ? 0 : selectedIndex + 1);
    };

    const handleThumbnailPrevious = () => {
        setThumbnailStartIndex((prev) => Math.max(0, prev - thumbnailsPerPage));
    };

    const handleThumbnailNext = () => {
        setThumbnailStartIndex((prev) =>
            Math.min(items.length - thumbnailsPerPage, prev + thumbnailsPerPage)
        );
    };

    const handleOpenPreviewInNewTab = (src: string) => {
        window.open(src, "_blank", "noopener,noreferrer");
    };

    // Safety check for empty media array
    if (!items.length || !items[selectedIndex]) {
        return null;
    }

    const selectedItem = items[selectedIndex];
    const isPlaceholderOnly =
        items.length === 1 && items[0]?.kind === "image" && items[0].src === "/window.svg";
    const showPreviousThumbs = items.length > thumbnailsPerPage && thumbnailStartIndex > 0;
    const showNextThumbs =
        items.length > thumbnailsPerPage &&
        thumbnailStartIndex + thumbnailsPerPage < items.length;

    const getIFrameThumbnailSrc = (src: string) => (src.includes("?") ? `${src}&view=360` : `${src}?view=360`);

    return (
        <>
            <div className="rounded-lg overflow-hidden mb-2 sm:mb-4 group relative aspect-video touch-manipulation">
                {selectedItem.kind === "iframe" ? (
                    <iframe
                        src={selectedItem.src}
                        title={`${title} - 360 preview`}
                        className="absolute inset-0 h-full w-full border-0"
                        allowFullScreen
                    />
                ) : (
                    <Visual
                        src={selectedItem.src}
                        alt={`${title} - Image ${selectedIndex + 1}`}
                        fill
                        objectFit="contain"
                        sizes="(max-width: 1024px) 100vw, 66vw"
                        priority
                        showBadge={false}
                    />
                )}

                {selectedItem.kind === "iframe" && (
                    <Button
                        variant="ghost"
                        size="sm"
                        pill
                        onClick={() => handleOpenPreviewInNewTab(selectedItem.src)}
                        className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 z-20 !bg-black/60 hover:!bg-black/70 !text-white !p-2 !min-h-0 shadow-lg active:scale-95"
                        aria-label="Open 360 preview in new tab"
                        title="Open 360 preview in new tab"
                    >
                        <Icon icon={Expand} size={{ base: 16, sm: 18 }} />
                    </Button>
                )}

                {/* Image Counter */}
                {items.length > 1 && (
                    <div className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-black/60 text-white px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium backdrop-blur-sm">
                        {selectedIndex + 1} / {items.length}
                    </div>
                )}

                {/* Navigation Arrows - Always visible on mobile, hidden on hover for desktop */}
                {items.length > 1 && (
                    <>
                        <button
                            onClick={handlePrevious}
                            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-2 sm:p-3 rounded-full shadow-lg transition-all sm:opacity-0 sm:group-hover:opacity-100 active:scale-95"
                            aria-label="Previous image"
                        >
                            <Icon icon={ChevronLeft} size={{ base: 20, sm: 24 }} />
                        </button>

                        <button
                            onClick={handleNext}
                            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-2 sm:p-3 rounded-full shadow-lg transition-all sm:opacity-0 sm:group-hover:opacity-100 active:scale-95"
                            aria-label="Next image"
                        >
                            <Icon icon={ChevronRight} size={{ base: 20, sm: 24 }} />
                        </button>
                    </>
                )}
            </div>

            {/* Image Thumbnails */}
            {items.length > 1 && !isPlaceholderOnly && (
                <div className="relative flex items-center gap-2">
                    {showPreviousThumbs && (
                        <button
                            onClick={handleThumbnailPrevious}
                            className="hidden sm:inline-flex flex-shrink-0 bg-white hover:bg-gray-50 text-gray-800 p-1.5 sm:p-2 rounded-full shadow-lg transition-all border border-gray-200 active:scale-95"
                            aria-label="Previous thumbnails"
                        >
                            <Icon icon={ChevronLeft} size={{ base: 16, sm: 20 }} />
                        </button>
                    )}

                    <div
                        className={clsx(
                            "flex-1",
                            "flex flex-nowrap gap-1.5 overflow-x-auto whitespace-nowrap py-0.5",
                            "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
                            "sm:grid sm:grid-cols-6 md:grid-cols-8 sm:gap-2 sm:overflow-x-visible sm:whitespace-normal sm:py-0"
                        )}
                    >
                        {items
                            .slice(thumbnailStartIndex, thumbnailStartIndex + thumbnailsPerPage)
                            .map((item, relativeIndex) => {
                                const index = thumbnailStartIndex + relativeIndex;
                                const isSelected = selectedIndex === index;
                                const thumbnailSrc =
                                    item.kind === "iframe"
                                        ? getIFrameThumbnailSrc(item.thumbnailSrc)
                                        : item.src;

                                return (
                                    <button
                                        key={`${item.kind}-${item.src}-${index}`}
                                        type="button"
                                        onClick={() => setSelectedIndex(index)}
                                        className={clsx(
                                            "relative block h-14 sm:h-16 md:h-20 w-20 sm:w-full rounded-lg overflow-hidden border-2 transition-all touch-manipulation active:scale-95 flex-shrink-0 sm:flex-shrink",
                                            isSelected
                                                ? "border-primary-500"
                                                : "border-border hover:border-text-muted"
                                        )}
                                        aria-label={
                                            item.kind === "iframe"
                                                ? "Select 360 preview"
                                                : `Select image ${index + 1}`
                                        }
                                        aria-current={isSelected ? "true" : "false"}
                                    >
                                        <Visual
                                            src={thumbnailSrc}
                                            alt={
                                                item.kind === "iframe"
                                                    ? `${title} 360 thumbnail`
                                                    : `${title} thumbnail ${index + 1}`
                                            }
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
                            <Icon icon={ChevronRight} size={{ base: 16, sm: 20 }} />
                        </button>
                    )}
                </div>
            )}
        </>
    );
}
