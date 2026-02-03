"use client";

import { useRef, useState } from "react";
import Image from "next/image";

export interface FileUploadProps {
    label: string;
    accept: string;
    multiple?: boolean;
    maxFiles?: number;
    maxSizeMB?: number;
    onChange: (files: File[]) => void;
    value?: File[];
    error?: string;
    helperText?: string;
    preview?: boolean;
}

export function FileUpload({
    label,
    accept,
    multiple = false,
    maxFiles = 10,
    maxSizeMB = 10,
    onChange,
    value = [],
    error,
    helperText,
    preview = true,
}: FileUploadProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragActive, setDragActive] = useState(false);

    const handleFiles = (files: FileList | null) => {
        if (!files) return;

        const fileArray = Array.from(files);
        const validFiles: File[] = [];
        const errors: string[] = [];

        // Validate files
        for (const file of fileArray) {
            // Check file size
            if (file.size > maxSizeMB * 1024 * 1024) {
                errors.push(`${file.name} is larger than ${maxSizeMB}MB`);
                continue;
            }

            validFiles.push(file);
        }

        // Check max files
        const totalFiles = value.length + validFiles.length;
        if (totalFiles > maxFiles) {
            errors.push(`You can only upload up to ${maxFiles} files`);
            const allowedCount = maxFiles - value.length;
            validFiles.splice(allowedCount);
        }

        if (errors.length > 0) {
            console.warn("File upload errors:", errors);
        }

        if (validFiles.length > 0) {
            onChange([...value, ...validFiles]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFiles(e.target.files);
        if (inputRef.current) {
            inputRef.current.value = "";
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        handleFiles(e.dataTransfer.files);
    };

    const removeFile = (index: number) => {
        const newFiles = [...value];
        newFiles.splice(index, 1);
        onChange(newFiles);
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>

            {/* Upload Area */}
            <div
                className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
                    dragActive
                        ? "border-primary-500 bg-primary-50"
                        : error
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300 hover:border-gray-400"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    multiple={multiple}
                    onChange={handleChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />

                <div className="text-center">
                    <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                    >
                        <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                    <p className="mt-2 text-sm text-gray-600">
                        <span className="font-semibold text-primary-600">Click to upload</span> or
                        drag and drop
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                        {helperText || `Up to ${maxFiles} files, max ${maxSizeMB}MB each`}
                    </p>
                </div>
            </div>

            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

            {/* File Preview */}
            {preview && value.length > 0 && (
                <div className="mt-4 space-y-2">
                    {value.map((file, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between bg-gray-50 rounded-lg p-2"
                        >
                            <div className="flex items-center space-x-3 flex-1 min-w-0 overflow-hidden">
                                {file.type.startsWith("image/") ? (
                                    <Image
                                        src={URL.createObjectURL(file)}
                                        alt={file.name}
                                        width={48}
                                        height={48}
                                        className="h-12 w-12 rounded object-cover flex-shrink-0"
                                        unoptimized
                                    />
                                ) : file.type.startsWith("video/") ? (
                                    <div className="h-12 w-12 rounded bg-gray-200 flex items-center justify-center flex-shrink-0">
                                        <svg
                                            className="h-6 w-6 text-gray-500"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                                            />
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                    </div>
                                ) : (
                                    <div className="h-12 w-12 rounded bg-gray-200 flex items-center justify-center flex-shrink-0">
                                        <svg
                                            className="h-6 w-6 text-gray-500"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                            />
                                        </svg>
                                    </div>
                                )}
                                <div className="flex-1 min-w-0 overflow-hidden">
                                    <p
                                        className="text-sm font-medium text-gray-900 truncate"
                                        title={file.name}
                                    >
                                        {file.name}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => removeFile(index)}
                                className="ml-3 p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                            >
                                <svg
                                    className="h-5 w-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
