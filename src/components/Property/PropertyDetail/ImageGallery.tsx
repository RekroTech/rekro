import { PropertyMedia } from "@/components/common";

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

    return (
        <div className="bg-gray-100 rounded-lg overflow-hidden mb-4 group relative aspect-video">
            <PropertyMedia
                src={images[selectedIndex]}
                alt={`${title} - Image ${selectedIndex + 1}`}
                fill
                sizes="(max-width: 1024px) 100vw, 66vw"
                priority
                showBadge={false}
            />

            {/* Image Counter */}
            {images.length > 1 && (
                <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
                    {selectedIndex + 1} / {images.length}
                </div>
            )}

            {/* Navigation Arrows */}
            {images.length > 1 && (
                <>
                    <button
                        onClick={handlePrevious}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100"
                        aria-label="Previous image"
                    >
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 19l-7-7 7-7"
                            />
                        </svg>
                    </button>

                    <button
                        onClick={handleNext}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100"
                        aria-label="Next image"
                    >
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                            />
                        </svg>
                    </button>
                </>
            )}
        </div>
    );
}
