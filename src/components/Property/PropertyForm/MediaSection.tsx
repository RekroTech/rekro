import React from "react";
import Image from "next/image";
import { Property } from "@/types/db";
import { getPropertyFileUrl } from "@/services/storage.service";
import { isVideoFile } from "./utils";

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
        <section className="rounded-lg border border-gray-200 bg-white/80 p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
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
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                                clipRule="evenodd"
                            />
                        </svg>
                        Add Media
                    </div>
                </label>
            </div>

            {/* Media Grid - Shows both existing and new files */}
            {(existingImages.length > 0 ||
                (existingVideoUrl && !removeVideo) ||
                mediaFiles.length > 0) && (
                <div className="grid grid-cols-4 gap-3">
                    {/* Existing Images */}
                    {existingImages.map((imageUrl, index) => (
                        <div
                            key={`existing-img-${index}`}
                            className="relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100"
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
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </button>
                        </div>
                    ))}

                    {/* New Uploaded Files */}
                    {mediaFiles.map((file, index) => (
                        <div
                            key={`new-${index}`}
                            className="relative aspect-square overflow-hidden rounded-lg border-2 border-dashed border-primary-300 bg-gray-50"
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
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Helper Text */}
            <p className="mt-3 text-xs text-gray-500">
                Upload photos and videos. Images max 10MB each, videos max 50MB.
            </p>
        </section>
    );
}
