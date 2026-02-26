import Image from "next/image";
import { Property } from "@/types/db";
import { getPropertyFileUrl } from "@/lib/services/storage.service";
import { Icon } from "@/components/common";
import { isVideoFile } from "@/lib/utils";

interface MediaSectionProps {
    mediaFiles: File[];
    existingImages: string[];
    existingVideoUrl: string | null;
    removeVideo: boolean;
    property?: Property;
    onAddFiles: (files: File[]) => void;
    onRemoveExistingImage: (imageUrl: string) => void;
    onRemoveUploadedFile: (index: number) => void;
}

export function MediaSection({
    mediaFiles,
    existingImages,
    existingVideoUrl,
    removeVideo,
    property,
    onAddFiles,
    onRemoveExistingImage,
    onRemoveUploadedFile,
}: MediaSectionProps) {
    return (
        <section className="rounded-lg border border-border bg-card p-3 shadow-[var(--shadow-soft)] sm:p-4">
            <div className="mb-3 flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
                    Media
                </h4>
                <label className="cursor-pointer">
                    <input
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            onAddFiles(files);
                            e.target.value = ""; // Reset input
                        }}
                    />
                    <div className="flex items-center gap-2 rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600">
                        <Icon name="plus" className="h-5 w-5" />
                        Add Media
                    </div>
                </label>
            </div>

            {/* Media Grid - Shows both existing and new files */}
            {(existingImages.length > 0 ||
                (existingVideoUrl && !removeVideo) ||
                mediaFiles.length > 0) && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {/* Existing Images */}
                    {existingImages.map((imageUrl, index) => (
                        <div
                            key={`existing-img-${index}`}
                            className="relative aspect-square overflow-hidden rounded-lg border border-border bg-surface-muted"
                        >
                            <Image
                                src={getPropertyFileUrl(imageUrl, property?.id)}
                                alt={`Property ${index + 1}`}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 25vw, 20vw"
                            />
                            <div className="absolute left-2 top-2 rounded bg-blue-500 px-2 py-0.5 text-xs font-medium text-white">
                                Current
                            </div>
                            <button
                                type="button"
                                onClick={() => onRemoveExistingImage(imageUrl)}
                                className="absolute right-1 top-1 z-10 rounded-full bg-red-500 p-1.5 text-white shadow-lg transition-colors hover:bg-red-600"
                                title="Remove image"
                            >
                                <Icon name="x" className="h-4 w-4" />
                            </button>
                        </div>
                    ))}

                    {/* New Uploaded Files */}
                    {mediaFiles.map((file, index) => (
                        <div
                            key={`new-${index}`}
                            className="relative aspect-square overflow-hidden rounded-lg border-2 border-dashed border-primary-300 bg-surface-subtle"
                        >
                            {isVideoFile(file) ? (
                                <>
                                    <video
                                        src={URL.createObjectURL(file)}
                                        className="h-full w-full object-cover"
                                    />
                                    <div className="absolute left-2 top-2 rounded bg-green-500 px-2 py-0.5 text-xs font-medium text-white">
                                        New Video
                                    </div>
                                </>
                            ) : (
                                <>
                                    <Image
                                        src={URL.createObjectURL(file)}
                                        alt={file.name}
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 768px) 25vw, 20vw"
                                    />
                                    <div className="absolute left-2 top-2 rounded bg-green-500 px-2 py-0.5 text-xs font-medium text-white">
                                        New
                                    </div>
                                </>
                            )}
                            <button
                                type="button"
                                onClick={() => onRemoveUploadedFile(index)}
                                className="absolute right-1 top-1 z-10 rounded-full bg-red-500 p-1.5 text-white shadow-lg transition-colors hover:bg-red-600"
                                title="Remove file"
                            >
                                <Icon name="x" className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Helper Text */}
            <p className="mt-3 text-xs text-text-muted">
                Upload photos and videos. Images max 10MB each, videos max 50MB.
            </p>
        </section>
    );
}
