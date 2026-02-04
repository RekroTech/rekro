"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import clsx from "clsx";
import { getMediaType } from "@/lib/utils/fileUtils";

export interface PropertyMediaProps {
    src: string;
    alt: string;
    fill?: boolean;
    width?: number;
    height?: number;
    className?: string;
    sizes?: string;
    priority?: boolean;
    loading?: "lazy" | "eager";
    onError?: () => void;
    fallbackSrc?: string;
    objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down";

    // Videos
    autoPlay?: boolean;
    muted?: boolean;
    loop?: boolean;
    controls?: boolean;

    /**
     * Show 360° badge for 360 images (default: true)
     */
    showBadge?: boolean;

    /**
     * Disable Next/Image optimization for remote URLs (recommended for Supabase Storage)
     */
    unoptimizedRemote?: boolean;
}

export function PropertyMedia({
    src,
    alt,
    fill = false,
    width,
    height,
    className,
    sizes,
    priority = false,
    loading = "lazy",
    onError,
    fallbackSrc = "/window.svg",
    objectFit = "cover",

    autoPlay = false,
    muted = true,
    loop = false,
    controls = true,

    showBadge = true,

    unoptimizedRemote = true,
}: PropertyMediaProps) {
    const [errored, setErrored] = useState(false);

    const effectiveSrc = errored ? fallbackSrc : src;

    const mediaType = useMemo(() => {
        if (errored || effectiveSrc === fallbackSrc) return "image";
        return getMediaType(effectiveSrc);
    }, [errored, effectiveSrc, fallbackSrc]);

    const objectFitClass = clsx({
        "object-cover": objectFit === "cover",
        "object-contain": objectFit === "contain",
        "object-fill": objectFit === "fill",
        "object-scale-down": objectFit === "scale-down",
        "object-none": objectFit === "none",
    });

    const isRemote =
        typeof effectiveSrc === "string" &&
        (effectiveSrc.startsWith("http://") || effectiveSrc.startsWith("https://"));

    const shouldUnoptimize =
        errored || effectiveSrc === fallbackSrc || (unoptimizedRemote && isRemote);

    const handleError = () => {
        if (!errored) {
            setErrored(true);
            onError?.();
        }
    };

    const wrapperClass = clsx(className, fill && "relative h-full w-full");

    /* ---------------- VIDEO ---------------- */
    if (mediaType === "video") {
        return (
            <div
                className={wrapperClass}
                style={!fill && width && height ? { width, height } : undefined}
            >
                <video
                    src={effectiveSrc}
                    className={clsx(objectFitClass, fill && "absolute inset-0 h-full w-full")}
                    onError={handleError}
                    autoPlay={autoPlay}
                    muted={muted}
                    loop={loop}
                    controls={controls}
                    playsInline
                    preload="metadata"
                />

                {showBadge && (
                    <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black/25">
                        <div className="rounded-full bg-black/60 p-2 text-white">
                            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    /* ---------------- 360 ---------------- */
    if (mediaType === "360") {
        return (
            <div
                className={wrapperClass}
                title="360° View"
                style={!fill && width && height ? { width, height } : undefined}
            >
                <Image
                    key={effectiveSrc}
                    src={effectiveSrc}
                    alt={alt}
                    className={objectFitClass}
                    onError={handleError}
                    unoptimized={shouldUnoptimize}
                    priority={priority}
                    loading={priority ? undefined : loading}
                    sizes={sizes}
                    fill={fill}
                    width={!fill ? width : undefined}
                    height={!fill ? height : undefined}
                />

                {showBadge && (
                    <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black/25">
                        <span className="rounded-full bg-black/60 px-3 py-1 text-lg font-semibold text-white">
                            360°
                        </span>
                    </div>
                )}
            </div>
        );
    }

    /* ---------------- IMAGE ---------------- */
    return (
        <div
            className={wrapperClass}
            style={!fill && width && height ? { width, height } : undefined}
        >
            <Image
                key={effectiveSrc}
                src={effectiveSrc}
                alt={alt}
                className={objectFitClass}
                onError={handleError}
                unoptimized={shouldUnoptimize}
                priority={priority}
                loading={priority ? undefined : loading}
                sizes={sizes}
                fill={fill || !width || !height}
                width={!fill && width ? width : undefined}
                height={!fill && height ? height : undefined}
            />
        </div>
    );
}

export default PropertyMedia;
