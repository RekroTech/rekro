"use client";

import { useState } from "react";
import Link from "next/link";
import { Property, Unit } from "@/types/db";
import { Icon, Visual } from "@/components/common";
import { PropertyForm } from "@/components";
import { getPropertyFileUrl } from "@/services/storage.service";
import { getLocalityString } from "@/lib/utils/locationPrivacy";
import { ImageGallery } from "./PropertyDetail/ImageGalleryMobile";

interface PropertyCardProps {
    property: Property & { units?: Unit[] };
    showEditButton?: boolean; // Optional prop to show edit button
}

export function PropertyCard({ property, showEditButton = false }: PropertyCardProps) {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const {
        id,
        title,
        description,
        property_type,
        bedrooms,
        bathrooms,
        car_spaces,
        furnished,
        images,
        address,
        units,
    } = property;

    // Units are now included in the property data from the API
    // Get the first unit for price display
    const firstUnit = units && units.length > 0 ? units[0] : null;

    // Process all images for gallery
    const imageUrls = images && images.length > 0
        ? images.map(img => getPropertyFileUrl(img, id))
        : ["/window.svg"];

    // Format address to show only locality (suburb/city + state)
    const addressText = address ? getLocalityString(address) : "Location not specified";

    // Display price from the first unit if available
    const pricePerWeek = firstUnit?.price;

    return (
        <>
            <Link
                href={`/property/${id}`}
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
                            title={title}
                            hideIndicators
                        />
                    </div>

                    {/* Desktop: Simple Visual */}
                    <div className="hidden md:block h-full">
                        <Visual
                            src={imageUrls[0] || "/window.svg"}
                            alt={title}
                            fill
                            className="group-hover:scale-105 transition-transform duration-300"
                            priority
                        />
                    </div>

                    {/* Overlays on top of gallery */}
                    {furnished && (
                        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-primary-500 text-white text-xs font-semibold px-2 py-1 rounded-[var(--radius-md)] z-20 pointer-events-none">
                            Furnished
                        </div>
                    )}
                    {pricePerWeek && (
                        <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 bg-card/90 backdrop-blur-sm text-foreground text-sm font-bold px-3 py-1.5 rounded-[var(--radius-md)] shadow-md border border-border z-20 pointer-events-none">
                            ${pricePerWeek}/week
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
                            <Icon name="edit" className="w-4 h-4 sm:w-4 sm:h-4" />
                        </button>
                    )}
                </div>

                {/* Property Details */}
                <div className="p-3.5 sm:p-4">
                    {/* Property Type */}
                    {property_type && (
                        <div className="text-xs font-semibold text-primary-600 uppercase mb-1">
                            {property_type}
                        </div>
                    )}

                    {/* Title */}
                    <h3 className="text-base sm:text-lg font-bold text-text mb-2 line-clamp-1 group-hover:text-primary-600 transition-colors">
                        {title}
                    </h3>

                    {/* Address */}
                    <p className="text-sm text-text-muted mb-3 line-clamp-1 flex items-start gap-1">
                        <Icon name="location" className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-1">{addressText}</span>
                    </p>

                    {/* Description */}
                    {description && (
                        <p className="text-sm text-text-muted mb-3 line-clamp-2">{description}</p>
                    )}

                    {/* Property Features */}
                    <div className="flex items-center gap-3 sm:gap-4 text-sm text-text-muted">
                        {bedrooms !== null && bedrooms !== undefined && (
                            <div className="flex items-center gap-1">
                                <Icon name="bed" className="w-4 h-4" />
                                <span>
                                    {bedrooms} Bed{bedrooms !== 1 ? "s" : ""}
                                </span>
                            </div>
                        )}
                        {bathrooms !== null && bathrooms !== undefined && (
                            <div className="flex items-center gap-1">
                                <Icon name="bath" className="w-4 h-4" />
                                <span>
                                    {bathrooms} Bath{bathrooms !== 1 ? "s" : ""}
                                </span>
                            </div>
                        )}
                        {car_spaces !== null && car_spaces !== undefined && car_spaces > 0 && (
                            <div className="flex items-center gap-1">
                                <Icon name="car" className="w-4 h-4" />
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
