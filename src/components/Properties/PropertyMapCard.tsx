"use client";

import Link from "next/link";
import type { Property, Unit } from "@/types/db";
import { Icon, Visual } from "@/components/common";
import { getPropertyFileUrl } from "@/lib/services";
import { getLocalityString } from "@/lib/utils";
import { usePrefetchProperty } from "@/lib/hooks/property";

interface PropertyMapCardProps {
    property: Property & { units?: Unit[] };
    onClose?: () => void;
}

export function PropertyMapCard({ property, onClose }: PropertyMapCardProps) {
    const prefetchProperty = usePrefetchProperty();

    const {
        id,
        title,
        property_type,
        bedrooms,
        bathrooms,
        car_spaces,
        images,
        address,
        units,
    } = property;

    const firstUnit = units && units.length > 0 ? units[0] : null;
    const pricePerWeek = firstUnit?.price;
    const listingType = firstUnit?.listing_type ?? null;

    const imageUrl =
        images && images.length > 0 && images[0]
            ? getPropertyFileUrl(images[0], id)
            : "/window.svg";

    const addressText = address
        ? getLocalityString(address)
        : "Location not specified";

    const typeLabel = [property_type, listingType]
        .filter(Boolean)
        .join(" FOR ")
        .toUpperCase();

    return (
        <div className="relative flex w-full overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card shadow-[var(--shadow-deep)]">
            {/* Close button */}
            {onClose && (
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 z-20 rounded-full bg-card/80 backdrop-blur-sm p-1 shadow hover:bg-surface-muted transition-colors"
                    aria-label="Close"
                >
                    <Icon name="close" className="w-3.5 h-3.5 text-text" />
                </button>
            )}

            {/* Image */}
            <Link
                href={`/property/${id}`}
                onMouseEnter={() => prefetchProperty(id)}
                onTouchStart={() => prefetchProperty(id)}
                className="relative flex-shrink-0 w-[110px] sm:w-[130px] self-stretch"
                tabIndex={-1}
                aria-hidden
            >
                <Visual
                    src={imageUrl}
                    alt={title}
                    fill
                    objectFit="cover"
                    className="transition-transform duration-300 hover:scale-105"
                />
            </Link>

            {/* Details */}
            <Link
                href={`/property/${id}`}
                onMouseEnter={() => prefetchProperty(id)}
                onTouchStart={() => prefetchProperty(id)}
                className="group flex flex-1 min-w-0 flex-col justify-between p-2.5 sm:p-3 pr-7 sm:pr-8"
            >
                {/* Type label */}
                {typeLabel && (
                    <p className="text-[10px] sm:text-xs font-semibold text-primary-600 uppercase tracking-wide mb-0.5 line-clamp-1">
                        {typeLabel}
                    </p>
                )}

                {/* Price / Title */}
                <h3 className="text-sm sm:text-base font-bold text-text line-clamp-1 group-hover:text-primary-600 transition-colors leading-snug">
                    {pricePerWeek
                        ? `$${pricePerWeek.toLocaleString()}/wk`
                        : title}
                </h3>

                {/* Address */}
                <p className="mt-0.5 text-xs sm:text-sm text-text-muted line-clamp-2 leading-snug">
                    {addressText}
                </p>

                {/* Features */}
                <div className="mt-2 flex items-center gap-2 sm:gap-3 text-xs text-text-muted flex-wrap">
                    {bedrooms != null && (
                        <span className="flex items-center gap-1">
                            <Icon name="bed" className="w-3.5 h-3.5 flex-shrink-0" />
                            {bedrooms}
                        </span>
                    )}
                    {bathrooms != null && (
                        <span className="flex items-center gap-1">
                            <Icon name="bath" className="w-3.5 h-3.5 flex-shrink-0" />
                            {bathrooms}
                        </span>
                    )}
                    {car_spaces != null && car_spaces > 0 && (
                        <span className="flex items-center gap-1">
                            <Icon name="car" className="w-3.5 h-3.5 flex-shrink-0" />
                            {car_spaces}
                        </span>
                    )}
                </div>
            </Link>
        </div>
    );
}

