"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Property, UnitWithLikes } from "@/types/property.types";
import { Bed, Bath, Car, MapPin, Pencil } from "lucide-react";
import { Icon, Visual } from "@/components/common";
import { getPropertyFileUrlWithTransform } from "@/lib/services";
import { getLocalityString, getPriceBadges } from "@/lib/utils";
import { useRoles } from "@/lib/hooks";
import { usePrefetchProperty } from "@/lib/hooks/property";
import { ImageGallery } from "../Property/ImageGalleryMobile";
import { PropertyForm } from "../PropertyForm";
import { UnitLikeButton } from "../Property/PropertySidebar/UnitLikeButton";
import { ShareDropdown } from "@/components/Property";

interface PropertyCardProps {
    property: Property & { units?: UnitWithLikes[] };
    showEditButton?: boolean;
    /** Pass true for the first card above the fold so the LCP image is eagerly loaded. */
    priority?: boolean;
}

export function PropertyCard({
    property,
    showEditButton = false,
    priority = false,
}: PropertyCardProps) {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const prefetchProperty = usePrefetchProperty();
    const { isAdmin } = useRoles();

    const {
        id,
        property_type,
        bedrooms,
        bathrooms,
        car_spaces,
        furnished,
        images,
        address,
        price,
        units,
    } = property;

    const streetAddress = address?.street || getLocalityString(address);

    // Prefer an active unit for like/share actions; fall back to the first unit if needed.
    const firstUnit =
        units?.find((unit) => unit.status === "active") ?? (units && units.length > 0 ? units[0] : null);

    // Process all images for gallery
    const imageUrls = useMemo(
        () =>
            images && images.length > 0
                ? images.map((img) =>
                    getPropertyFileUrlWithTransform(img, { width: 1200, quality: 72 }, id)
                )
                : ["/window.svg"],
        [images, id]
    );

    // Format address to show only locality (suburb/city + state), street is shown above
    const addressText = address ? getLocalityString(address, false) : "Location not specified";

    const shouldShowBaseRent = isAdmin && Number.isFinite(price);
    const primaryPriceBadges = useMemo(
        () => (shouldShowBaseRent ? [] : getPriceBadges(units, "all")),
        [shouldShowBaseRent, units]
    );
    const primaryBadge = primaryPriceBadges[0] ?? null;
    const isEntireHomeBadge = primaryBadge?.listing_type === "entire_home";
    const roomDetailUnits = useMemo(
        () => (shouldShowBaseRent || isEntireHomeBadge ? [] : getPriceBadges(units, "room")),
        [isEntireHomeBadge, shouldShowBaseRent, units]
    );
    const roomCount = roomDetailUnits.length;
    const fromPrice = useMemo(() => {
        if (!roomDetailUnits.length) return null;

        const validPrices = roomDetailUnits
            .map((unit) => unit.price)
            .filter((unitPrice): unitPrice is number => Number.isFinite(unitPrice));

        if (!validPrices.length) return null;
        return Math.min(...validPrices);
    }, [roomDetailUnits]);

    return (
        <>
            <Link
                href={`/property/${id}`}
                onMouseEnter={() => prefetchProperty(id)}
                onTouchStart={() => prefetchProperty(id)}
                className="group relative block rounded-[var(--radius-lg)] border border-border bg-card overflow-hidden shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-deep)] transition-all duration-200"
            >
                {/* Property Image Gallery - Swipeable on mobile, simple Visual on desktop */}
                <div className="relative w-full h-48 sm:h-64" onClick={(e) => {
                    // Prevent navigation when interacting with gallery controls
                    if ((e.target as HTMLElement).closest("button")) {
                        e.preventDefault();
                    }
                }}>
                    {/* Mobile: ImageGallery with Embla */}
                    <div className="md:hidden h-full">
                        <ImageGallery
                            images={imageUrls}
                            title={streetAddress}
                            hideIndicators
                            priority={priority}
                        />
                    </div>

                    {/* Desktop: Simple Visual */}
                    <div className="hidden md:block h-full">
                        <Visual
                            src={imageUrls[0] || "/window.svg"}
                            alt={streetAddress}
                            fill
                            sizes="(max-width: 1024px) 50vw, 33vw"
                            className="group-hover:scale-105 transition-transform duration-300"
                            priority={priority}
                        />
                    </div>

                    {/* Overlays on top of gallery */}
                    {/* Like + Share buttons – top right */}
                    {firstUnit && (
                        <div
                            className="absolute top-2 right-2 sm:top-3 sm:right-3 flex items-center gap-1 z-20"
                            onClick={(e) => e.preventDefault()}
                        >
                            <UnitLikeButton
                                unitId={firstUnit.id}
                                propertyId={id}
                                isLiked={firstUnit.isLiked ?? false}
                                likesCount={firstUnit.likesCount ?? 0}
                            />
                            <ShareDropdown propertyAddress={streetAddress} unitId={firstUnit.id} propertyId={id} />
                        </div>
                    )}
                    {shouldShowBaseRent ? (
                        <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 z-20 pointer-events-none max-w-[calc(100%-1rem)]">
                            <div className="bg-card/90 backdrop-blur-sm px-2.5 py-1.5 rounded-[var(--radius-md)] shadow-md border border-border">
                                <p className="text-[10px] font-normal text-text-muted leading-none mb-0.5">
                                    Base rent
                                </p>
                                <p className="text-sm font-bold text-foreground leading-none">
                                    ${price} <span className="text-xs font-normal">/wk</span>
                                </p>
                            </div>
                        </div>
                    ) : isEntireHomeBadge && primaryBadge ? (
                        <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 z-20 pointer-events-none max-w-[calc(100%-1rem)]">
                            <div className="bg-card/90 backdrop-blur-sm px-2.5 py-1.5 rounded-[var(--radius-md)] shadow-md border border-border">
                                <p className="text-sm font-bold text-foreground leading-none">
                                    ${primaryBadge.price} <span className="text-xs font-normal">/wk</span>
                                </p>
                            </div>
                        </div>
                    ) : fromPrice !== null && roomDetailUnits.length > 0 && (
                        <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 z-20 pointer-events-none max-w-[calc(100%-1rem)]">
                            <div className="w-fit max-w-full bg-card/90 backdrop-blur-sm px-3 py-2 rounded-[var(--radius-md)] shadow-md border border-border text-left">
                                <p className="text-sm font-bold text-foreground leading-none">
                                    From ${fromPrice} <span className="text-xs font-normal">/wk</span>
                                </p>
                                {roomCount > 0 && (
                                    <p className="text-[11px] text-text-muted mt-0.5 leading-none">
                                        {roomCount} room{roomCount !== 1 ? "s" : ""} available
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                    {showEditButton && (
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsEditModalOpen(true);
                            }}
                            className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-card hover:bg-surface-muted active:bg-surface-muted text-foreground p-2 sm:p-1.5 rounded-full shadow-xl transition-all duration-200 hover:scale-110 z-20 border-2 border-border hover:border-text-muted touch-manipulation min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                            aria-label="Edit property"
                            title="Edit property"
                        >
                            <Icon icon={Pencil} size={16} />
                        </button>
                    )}
                </div>

                {/* Property Details */}
                <div className="p-3.5 sm:p-4">
                    {/* Property Type + Furnished badge */}
                    {(property_type || furnished) && (
                        <div className="flex items-center justify-between mb-1">
                            {property_type && (
                                <span className="text-xs font-semibold text-primary-600 uppercase">
                                    {property_type}
                                </span>
                            )}
                            {furnished && (
                                <span className="ml-auto bg-primary-500 text-white text-xs font-semibold px-2 py-0.5 rounded-[var(--radius-md)]">
                                    Furnished
                                </span>
                            )}
                        </div>
                    )}

                    {/* Title */}
                    <h3 className="text-base sm:text-lg font-bold text-text mb-2 line-clamp-1 group-hover:text-primary-600 transition-colors">
                        {streetAddress}
                    </h3>

                    {/* Address */}
                    <p className="text-sm text-text-muted mb-3 line-clamp-1 flex items-start gap-1">
                        <Icon icon={MapPin} size={16} className="flex-shrink-0" />
                        <span className="line-clamp-1">{addressText}</span>
                    </p>


                    {/* Property Features */}
                    <div className="flex items-center gap-3 sm:gap-4 text-sm text-text-muted">
                        {bedrooms !== null && bedrooms !== undefined && (
                            <div className="flex items-center gap-1">
                                <Icon icon={Bed} size={16} />
                                <span>
                                    {bedrooms} Bed{bedrooms !== 1 ? "s" : ""}
                                </span>
                            </div>
                        )}
                        {bathrooms !== null && bathrooms !== undefined && (
                            <div className="flex items-center gap-1">
                                <Icon icon={Bath} size={16} />
                                <span>
                                    {bathrooms} Bath{bathrooms !== 1 ? "s" : ""}
                                </span>
                            </div>
                        )}
                        {car_spaces !== null && car_spaces !== undefined && car_spaces > 0 && (
                            <div className="flex items-center gap-1">
                                <Icon icon={Car} size={16} />
                                <span>{car_spaces} Car</span>
                            </div>
                        )}
                    </div>
                </div>
            </Link>

            {/* Edit Modal */}
            {showEditButton && isEditModalOpen && (
                <PropertyForm
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    propertyId={property.id}
                />
            )}
        </>
    );
}
