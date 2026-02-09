"use client";

import { Property, Unit } from "@/types/db";
import { Icon, Visual } from "@/components/common";
import Link from "next/link";
import { useState } from "react";
import { PropertyForm } from "@/components";
import { getPropertyFileUrl } from "@/services/storage.service";

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

    // Get the first image or use a placeholder
    const imagePath = images && images.length > 0 ? images[0] : null;
    const imageUrl = imagePath ? getPropertyFileUrl(imagePath, id) : "/window.svg";

    // Format address
    const addressText =
        address !== null
            ? Object.values(address).filter(Boolean).join(", ")
            : "Location not specified";

    // Display price from the first unit if available
    const pricePerWeek = firstUnit?.price_per_week;

    return (
        <>
            <div className="group relative block rounded-[var(--radius-lg)] border border-border bg-card overflow-hidden shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-deep)] transition-all duration-200">
                {/* Property Image */}
                <Link href={`/property/${id}`} className="block">
                    <div className="relative h-48 w-full bg-surface-muted overflow-hidden">
                        <Visual
                            src={imageUrl}
                            alt={title}
                            fill
                            className="group-hover:scale-105 transition-transform duration-300"
                        />
                        {furnished && (
                            <div className="absolute top-3 right-3 bg-primary-500 text-white text-xs font-semibold px-2 py-1 rounded-[var(--radius-md)]">
                                Furnished
                            </div>
                        )}
                        {pricePerWeek && (
                            <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm text-gray-900 text-sm font-bold px-3 py-1.5 rounded-[var(--radius-md)] shadow-md">
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
                                className="absolute top-3 left-3 bg-white hover:bg-gray-100 text-gray-800 p-1.5 rounded-full shadow-xl transition-all duration-200 hover:scale-110 z-10 border-2 border-gray-200 hover:border-gray-300"
                                aria-label="Edit property"
                                title="Edit property"
                            >
                                <Icon name="edit" className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </Link>

                {/* Property Details */}
                <div className="p-4">
                    {/* Property Type */}
                    {property_type && (
                        <div className="text-xs font-semibold text-primary-600 uppercase mb-1">
                            {property_type}
                        </div>
                    )}

                    {/* Title */}
                    <h3 className="text-lg font-bold text-text mb-2 line-clamp-1 group-hover:text-primary-600 transition-colors">
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
                    <div className="flex items-center gap-4 text-sm text-text-muted">
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
            </div>

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
