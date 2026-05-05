import { useCallback, useEffect, useState } from "react";
import { clsx } from "clsx";
import useEmblaCarousel from "embla-carousel-react";
import { Expand } from "lucide-react";
import { Button, Icon, Visual } from "@/components/common";
import type { GalleryItem } from "@/types/property.types";

interface ImageGalleryProps {
    items: GalleryItem[];
    title?: string;
    hideIndicators?: boolean;
    /** Eagerly load the first image when it is the LCP element. */
    priority?: boolean;
}

export function ImageGalleryMobile({
    items,
    title = "Property",
    hideIndicators = false,
    priority = false,
}: ImageGalleryProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Main carousel
    const [emblaRef, emblaApi] = useEmblaCarousel({
        loop: true,
        skipSnaps: false,
        duration: 25,
    });

    // Listen to Embla changes and update internal state
    useEffect(() => {
        if (!emblaApi) return;

        const onSelect = () => {
            const index = emblaApi.selectedScrollSnap();
            setSelectedIndex(index);
        };

        emblaApi.on("select", onSelect);
        return () => {
            emblaApi.off("select", onSelect);
        };
    }, [emblaApi]);

    const handleIndicatorClick = useCallback(
        (index: number) => {
            if (!emblaApi) return;
            emblaApi.scrollTo(index);
        },
        [emblaApi]
    );

    const handleOpenPreviewInNewTab = (src: string) => {
        window.open(src, "_blank", "noopener,noreferrer");
    };

    if (!items || items.length === 0) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-gray-100">
                <p className="text-gray-500">No images available</p>
            </div>
        );
    }

    const selectedItem = items[selectedIndex];
    const isSelectedIframe = selectedItem?.kind === "iframe";

    return (
        <div className="flex h-full flex-col">
            {/* Main Image Display */}
            <div className="relative flex-1">
                {/* Embla Carousel Container */}
                <div className="embla h-full" ref={emblaRef}>
                    <div className="embla__container flex h-full">
                        {items.map((item, index) => (
                            <div
                                key={index}
                                className="embla__slide relative min-w-0 flex-[0_0_100%]"
                            >
                                <div className="relative h-full w-full">
                                    {item.kind === "iframe" ? (
                                        <iframe
                                            src={item.src}
                                            title={`${title} - 360 preview`}
                                            className="absolute inset-0 h-full w-full border-0"
                                            allowFullScreen
                                        />
                                    ) : (
                                        <Visual
                                            src={item.src}
                                            alt={`${title} - Image ${index + 1}`}
                                            fill
                                            sizes="100vw"
                                            className="object-contain"
                                            priority={index === 0 && priority}
                                        />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Image Counter */}
                <div
                    className={clsx(
                        "absolute bottom-4 rounded-full bg-black/60 px-3 py-1 text-sm text-white",
                        isSelectedIframe ? "right-16" : "right-4"
                    )}
                >
                    {selectedIndex + 1} / {items.length}
                </div>

                {isSelectedIframe && selectedItem && (
                    <Button
                        variant="ghost"
                        size="sm"
                        pill
                        onClick={() => handleOpenPreviewInNewTab(selectedItem.src)}
                        className="absolute bottom-4 right-4 z-20 !bg-black/60 hover:!bg-black/70 !text-white !p-2 !min-h-0 shadow-lg active:scale-95"
                        aria-label="Open 360 preview in new tab"
                        title="Open 360 preview in new tab"
                    >
                        <Icon icon={Expand} size={{ base: 16, sm: 18 }} />
                    </Button>
                )}
            </div>

            {/* Swipe Indicators */}
            {!hideIndicators && items.length > 1 && (
                <div className="mt-4 flex justify-center gap-2">
                    {items.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => handleIndicatorClick(index)}
                            className={clsx(
                                "h-2 rounded-full transition-all",
                                index === selectedIndex ? "w-8 bg-primary-500" : "w-2 bg-border"
                            )}
                            aria-label={`Go to image ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

