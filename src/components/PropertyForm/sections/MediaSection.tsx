import { useState } from "react";
import Image from "next/image";
import { Property } from "@/types/db";
import { getPropertyFileUrl } from "@/lib/services/storage.service";
import { Plus, X } from "lucide-react";
import { Icon } from "@/components/common";

interface MediaSectionProps {
    mediaFiles: File[];
    existingImages: string[];
    property?: Property;
    onAddFiles: (files: File[]) => void;
    onReorderExistingImage: (fromIndex: number, toIndex: number) => void;
    onReorderUploadedFile: (fromIndex: number, toIndex: number) => void;
    onRemoveExistingImage: (imageUrl: string) => void;
    onRemoveUploadedFile: (index: number) => void;
}

type DragSource =
    | { type: "existing"; index: number }
    | { type: "uploaded"; index: number };

export function MediaSection({
    mediaFiles,
    existingImages,
    property,
    onAddFiles,
    onReorderExistingImage,
    onReorderUploadedFile,
    onRemoveExistingImage,
    onRemoveUploadedFile,
}: MediaSectionProps) {
    const [dragSource, setDragSource] = useState<DragSource | null>(null);
    const [dragOverKey, setDragOverKey] = useState<string | null>(null);

    const getUploadedPhotoOrder = (index: number) => {
        return existingImages.length + index + 1;
    };

    const handleDrop = (target: DragSource) => {
        if (!dragSource) {
            return;
        }

        if (dragSource.type !== target.type || dragSource.index === target.index) {
            setDragSource(null);
            setDragOverKey(null);
            return;
        }

        if (target.type === "existing") {
            onReorderExistingImage(dragSource.index, target.index);
        } else {
            onReorderUploadedFile(dragSource.index, target.index);
        }

        setDragSource(null);
        setDragOverKey(null);
    };

    return (
        <section className="rounded-lg border border-border bg-card p-3 shadow-[var(--shadow-soft)] sm:p-4">
            <div className="mb-3 flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
                    Media
                </h4>
                <label className="cursor-pointer">
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            onAddFiles(files);
                            e.target.value = ""; // Reset input
                        }}
                    />
                    <div className="flex items-center gap-2 rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600">
                        <Icon icon={Plus} size={20} />
                        Add Photos
                    </div>
                </label>
            </div>

            {/* Media Grid - Shows both existing and new files */}
            {(existingImages.length > 0 || mediaFiles.length > 0) && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {/* Existing Images */}
                    {existingImages.map((imageUrl, index) => (
                        <div
                            key={`existing-img-${index}`}
                            className={`relative aspect-square overflow-hidden rounded-lg border border-border bg-surface-muted ${
                                dragOverKey === `existing-${index}`
                                    ? "ring-2 ring-primary-500 ring-offset-1 ring-offset-background"
                                    : ""
                            }`}
                            draggable
                            onDragStart={() => setDragSource({ type: "existing", index })}
                            onDragEnd={() => {
                                setDragSource(null);
                                setDragOverKey(null);
                            }}
                            onDragOver={(e) => {
                                e.preventDefault();
                                setDragOverKey(`existing-${index}`);
                            }}
                            onDragLeave={() => setDragOverKey(null)}
                            onDrop={(e) => {
                                e.preventDefault();
                                handleDrop({ type: "existing", index });
                            }}
                        >
                            <Image
                                src={getPropertyFileUrl(imageUrl, property?.id)}
                                alt={`Property ${index + 1}`}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 25vw, 20vw"
                            />
                            <button
                                type="button"
                                onClick={() => onRemoveExistingImage(imageUrl)}
                                className="absolute right-1 top-1 z-10 rounded-full bg-red-500 p-1.5 text-white shadow-lg transition-colors hover:bg-red-600"
                                title="Remove image"
                            >
                                <Icon icon={X} size={16} />
                            </button>
                            <div className="absolute bottom-1 right-1 z-10 rounded-full border border-border bg-card/95 px-2 py-0.5 text-xs font-semibold text-text-primary shadow-sm">
                                {index + 1}
                            </div>
                        </div>
                    ))}

                    {/* New Uploaded Files */}
                    {mediaFiles.map((file, index) => (
                        <div
                            key={`new-${index}`}
                            className={`relative aspect-square overflow-hidden rounded-lg border-2 border-dashed border-primary-300 bg-surface-subtle ${
                                dragOverKey === `uploaded-${index}`
                                    ? "ring-2 ring-primary-500 ring-offset-1 ring-offset-background"
                                    : ""
                            }`}
                            draggable
                            onDragStart={() => {
                                setDragSource({ type: "uploaded", index });
                            }}
                            onDragEnd={() => {
                                setDragSource(null);
                                setDragOverKey(null);
                            }}
                            onDragOver={(e) => {
                                e.preventDefault();
                                setDragOverKey(`uploaded-${index}`);
                            }}
                            onDragLeave={() => setDragOverKey(null)}
                            onDrop={(e) => {
                                e.preventDefault();
                                handleDrop({ type: "uploaded", index });
                            }}
                        >
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
                            <div className="absolute bottom-1 right-1 z-10 rounded-full border border-border bg-card/95 px-2 py-0.5 text-xs font-semibold text-text-primary shadow-sm">
                                {getUploadedPhotoOrder(index)}
                            </div>
                            <button
                                type="button"
                                onClick={() => onRemoveUploadedFile(index)}
                                className="absolute right-1 top-1 z-10 rounded-full bg-red-500 p-1.5 text-white shadow-lg transition-colors hover:bg-red-600"
                                title="Remove file"
                            >
                                <Icon icon={X} size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Helper Text */}
            <p className="mt-3 text-xs text-text-muted">
                Upload photos only. Drag photos to reorder. Images max 10MB each.
            </p>
        </section>
    );
}
