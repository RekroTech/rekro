import { Icon, Visual } from "@/components/common";

interface ImageGalleryProps {
    images: string[];
    title: string;
    selectedIndex: number;
    onIndexChange: (index: number) => void;
}

export function ImageGallery({ images, title, selectedIndex, onIndexChange }: ImageGalleryProps) {
    const handlePrevious = () => {
        onIndexChange(selectedIndex === 0 ? images.length - 1 : selectedIndex - 1);
    };

    const handleNext = () => {
        onIndexChange(selectedIndex === images.length - 1 ? 0 : selectedIndex + 1);
    };

    // Safety check for empty images array
    if (!images.length || !images[selectedIndex]) {
        return null;
    }

    return (
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
    );
}
