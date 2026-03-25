"use client";

import { useState } from "react";
import Link from "next/link";
import type { Property, Unit } from "@/types/db";
import { ListingTab } from "@/types";
import { Bed, Bath, Car, MapPin, Pencil } from "lucide-react";
import { Icon, Visual } from "@/components/common";
import { getPropertyFileUrl } from "@/lib/services";
import { getLocalityString, getPriceBadges } from "@/lib/utils";
import { usePrefetchProperty } from "@/lib/hooks/property";
import { ImageGallery } from "../Property/ImageGalleryMobile";
import { PropertyForm } from "../PropertyForm";
import { UnitLikeButton } from "../Property/PropertySidebar/UnitLikeButton";
import { ShareDropdown } from "@/components/Property";

interface PropertyCardProps {
    property: Property & { units?: Unit[] };
    showEditButton?: boolean;
    priceDisplayMode?: ListingTab;
    /** Pass true for the first card above the fold so the LCP image is eagerly loaded. */
    priority?: boolean;
}

export function PropertyCard({
    property,
    showEditButton = false,
    priceDisplayMode = "all" as ListingTab,
    priority = false,
}: PropertyCardProps) {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const prefetchProperty = usePrefetchProperty();

    const {
        id,
        property_type,
        bedrooms,
        bathrooms,
        car_spaces,
        furnished,
        images,
        address,
        units,
    } = property;

    const streetAddress = address?.street || getLocalityString(address);

    // Units are now included in the property data from the API
    // Get the first unit for like/share button references
    const firstUnit = units && units.length > 0 ? units[0] : null;

    // Process all images for gallery
    const imageUrls = images && images.length > 0
        ? images.map(img => getPropertyFileUrl(img, id))
        : ["/window.svg"];

    // Format address to show only locality (suburb/city + state), street is shown above
    const addressText = address ? getLocalityString(address, false) : "Location not specified";

    const priceBadges = getPriceBadges(units, priceDisplayMode);

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
                    if ((e.target as HTMLElement).closest('button')) {
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
                            <UnitLikeButton unitId={firstUnit.id} propertyId={id} />
                            <ShareDropdown propertyAddress={streetAddress} unitId={firstUnit.id} propertyId={id} />
                        </div>
                    )}
                    {priceBadges.length > 0 && (
                        <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 flex flex-wrap gap-1.5 z-20 pointer-events-none max-w-[calc(100%-1rem)]">
                            {priceBadges.map((unit, i) => {
                                const roomNumber = priceBadges.slice(0, i + 1).filter(u => u.listing_type !== "entire_home").length;
                                return (
                                    <div key={unit.id} className="bg-card/90 backdrop-blur-sm px-2.5 py-1.5 rounded-[var(--radius-md)] shadow-md border border-border">
                                        {unit.listing_type !== "entire_home" && (
                                            <p className="text-[10px] font-normal text-text-muted leading-none mb-0.5">
                                                {unit.name || `Room ${roomNumber}`}
                                            </p>
                                        )}
                                        <p className="text-sm font-bold text-foreground leading-none">
                                            ${unit.price} <span className="text-xs font-normal">/wk</span>
                                        </p>
                                    </div>
                                );
                            })}
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
                    property={{ ...property, units: property.units || [] }}
                />
            )}
        </>
    );
}
