"use client";

import { Property } from "@/types/db";
import { PropertyMedia } from "@/components/common";
import Link from "next/link";
import { useState } from "react";
import { PropertyModal } from "@/components";
import { getPropertyFileUrl } from "@/services/storage.service";

interface PropertyCardProps {
    property: Property;
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
    } = property;

    // Get the first image or use a placeholder
    const imagePath = images && images.length > 0 ? images[0] : null;
    const imageUrl = imagePath ? getPropertyFileUrl(imagePath, id) : "/window.svg";

    // Format address
    const addressText =
        address !== null
            ? Object.values(address).filter(Boolean).join(", ")
            : "Location not specified";

    return (
        <>
            <div className="group relative block rounded-[var(--radius-lg)] border border-border bg-card overflow-hidden shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-deep)] transition-all duration-200">
                {/* Property Image */}
                <Link href={`/property/${id}`} className="block">
                    <div className="relative h-48 w-full bg-surface-muted overflow-hidden">
                        <PropertyMedia
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
                        {showEditButton && (
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setIsEditModalOpen(true);
                                }}
                                className="absolute top-3 left-3 bg-white hover:bg-gray-100 text-gray-800 p-3 rounded-full shadow-xl transition-all duration-200 hover:scale-110 z-10 border-2 border-gray-200 hover:border-gray-300"
                                aria-label="Edit property"
                                title="Edit property"
                            >
                                <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth={2.5}
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                    />
                                </svg>
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
                        <svg
                            className="w-4 h-4 mt-0.5 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                        </svg>
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
                                <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                                    />
                                </svg>
                                <span>
                                    {bedrooms} Bed{bedrooms !== 1 ? "s" : ""}
                                </span>
                            </div>
                        )}
                        {bathrooms !== null && bathrooms !== undefined && (
                            <div className="flex items-center gap-1">
                                <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
                                    />
                                </svg>
                                <span>
                                    {bathrooms} Bath{bathrooms !== 1 ? "s" : ""}
                                </span>
                            </div>
                        )}
                        {car_spaces !== null && car_spaces !== undefined && car_spaces > 0 && (
                            <div className="flex items-center gap-1">
                                <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 7v10M8 7l-3 3m3-3l3 3m10 4v-8a4 4 0 00-4-4H6a4 4 0 00-4 4v8"
                                    />
                                </svg>
                                <span>{car_spaces} Car</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {showEditButton && (
                <PropertyModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    property={property}
                />
            )}
        </>
    );
}
