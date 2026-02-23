import { Visual } from "@/components/common";
import { useCallback, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";

interface ImageGalleryProps {
    images: string[];
    title: string;
    selectedIndex: number;
    onIndexChange: (index: number) => void;
    hideIndicators?: boolean;
}

export function ImageGallery({
    images,
    title,
    selectedIndex,
    onIndexChange,
    hideIndicators = false,
}: ImageGalleryProps) {
    // Main carousel
    const [emblaRef, emblaApi] = useEmblaCarousel({
        loop: true,
        skipSnaps: false,
        duration: 25,
    });

    // Sync Embla with parent's selectedIndex
    useEffect(() => {
        if (!emblaApi) return;
        emblaApi.scrollTo(selectedIndex, false);
    }, [emblaApi, selectedIndex]);

    // Listen to Embla changes and notify parent
    useEffect(() => {
        if (!emblaApi) return;

        const onSelect = () => {
            const index = emblaApi.selectedScrollSnap();
            if (index !== selectedIndex) {
                onIndexChange(index);
            }
        };

        emblaApi.on("select", onSelect);
        return () => {
            emblaApi.off("select", onSelect);
        };
    }, [emblaApi, selectedIndex, onIndexChange]);

    const handleIndicatorClick = useCallback(
        (index: number) => {
            if (!emblaApi) return;
            emblaApi.scrollTo(index);
        },
        [emblaApi]
    );

    if (!images || images.length === 0) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-gray-100">
                <p className="text-gray-500">No images available</p>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col">
            {/* Main Image Display */}
            <div className="relative flex-1">
                {/* Embla Carousel Container */}
                <div className="embla h-full" ref={emblaRef}>
                    <div className="embla__container flex h-full">
                        {images.map((src, index) => (
                            <div
                                key={index}
                                className="embla__slide relative min-w-0 flex-[0_0_100%]"
                            >
                                <div className="relative h-full w-full">
                                    <Visual
                                        src={src}
                                        alt={`${title} - Image ${index + 1}`}
                                        fill
                                        sizes="100vw"
                                        className="object-contain"
                                        priority={index === 0}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Image Counter */}
                <div className="absolute bottom-4 right-4 rounded-full bg-black/60 px-3 py-1 text-sm text-white">
                    {selectedIndex + 1} / {images.length}
                </div>
            </div>

            {/* Swipe Indicators */}
            {!hideIndicators && images.length > 1 && (
                <div className="mt-4 flex justify-center gap-2">
                    {images.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => handleIndicatorClick(index)}
                            className={`h-2 rounded-full transition-all ${
                                index === selectedIndex
                                    ? "w-8 bg-primary-500"
                                    : "w-2 bg-border"
                            }`}
                            aria-label={`Go to image ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

