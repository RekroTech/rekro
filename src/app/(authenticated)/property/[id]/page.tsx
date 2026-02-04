"use client";

import { useProperty } from "@/lib/react-query/hooks/useProperties";
import { Loader, Button, PropertyMedia } from "@/components/common";
import Link from "next/link";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPropertyFileUrls } from "@/services/storage.service";

export default function PropertyDetailPage() {
    const params = useParams();
    const router = useRouter();
    const propertyId = params.id as string;
    const { data: property, isLoading, error } = useProperty(propertyId);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [thumbnailStartIndex, setThumbnailStartIndex] = useState(0);
    const THUMBNAILS_PER_PAGE = 8;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader size="lg" />
            </div>
        );
    }

    if (error || !property) {
        return (
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Property Not Found</h1>
                    <p className="text-text-muted mb-6">
                        The property you&apos;re looking for doesn&apos;t exist or has been removed.
                    </p>
                    <Button variant="primary" onClick={() => router.push("/dashboard")}>
                        Back to Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    const {
        title,
        description,
        property_type,
        bedrooms,
        bathrooms,
        car_spaces,
        furnished,
        amenities,
        images,
        address,
    } = property;

    // Convert storage paths to URLs
    const propertyMedia =
        images && images.length > 0 ? getPropertyFileUrls(images, propertyId) : ["/window.svg"];

    const currentImage = propertyMedia[selectedImageIndex];
    const isPlaceholder = currentImage === "/window.svg";

    // Format address
    const addressText =
        address !== null
            ? Object.values(address).filter(Boolean).join(", ")
            : "Location not specified";

    return (
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {/* Back Button */}
            <div className="mb-6">
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                        />
                    </svg>
                    Back to Properties
                </Link>
            </div>

            {/* Property Header */}
            <div className="mb-6">
                {property_type && (
                    <div className="text-sm font-semibold text-primary-600 uppercase mb-2">
                        {property_type}
                    </div>
                )}
                <h1 className="text-3xl md:text-4xl font-bold text-text mb-3">{title}</h1>
                <p className="text-lg text-text-muted flex items-center gap-2 mb-4">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    {addressText}
                </p>

                {/* Property Features */}
                <div className="flex flex-wrap items-center gap-4 md:gap-6 text-text-muted">
                    {bedrooms !== null && bedrooms !== undefined && (
                        <div className="flex items-center gap-2">
                            <svg
                                className="w-5 h-5 md:w-6 md:h-6"
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
                            <span className="text-base md:text-lg font-semibold">
                                {bedrooms} Bed{bedrooms !== 1 ? "s" : ""}
                            </span>
                        </div>
                    )}
                    {bathrooms !== null && bathrooms !== undefined && (
                        <div className="flex items-center gap-2">
                            <svg
                                className="w-5 h-5 md:w-6 md:h-6"
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
                            <span className="text-base md:text-lg font-semibold">
                                {bathrooms} Bath{bathrooms !== 1 ? "s" : ""}
                            </span>
                        </div>
                    )}
                    {car_spaces !== null && car_spaces !== undefined && car_spaces > 0 && (
                        <div className="flex items-center gap-2">
                            <svg
                                className="w-5 h-5 md:w-6 md:h-6"
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
                            <span className="text-base md:text-lg font-semibold">
                                {car_spaces} Car{car_spaces !== 1 ? "s" : ""}
                            </span>
                        </div>
                    )}
                    {furnished && (
                        <div className="flex items-center gap-2">
                            <svg
                                className="w-5 h-5 md:w-6 md:h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                            <span className="text-base md:text-lg font-semibold">Furnished</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Grid: Image Gallery (2/3) + Sidebar (1/3) */}
            <div className="grid gap-6 mb-8 grid-cols-3">
                {/* Image Gallery - 2/3 width */}
                <div className="col-span-2">
                    <div className="bg-gray-100 rounded-lg overflow-hidden mb-4 group relative aspect-video">
                        <PropertyMedia
                            src={propertyMedia[selectedImageIndex]}
                            alt={`${title} - Image ${selectedImageIndex + 1}`}
                            fill
                            sizes="(max-width: 1024px) 100vw, 66vw"
                            priority
                            showBadge={false}
                        />

                        {/* Image Counter */}
                        {propertyMedia.length > 1 && (
                            <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
                                {selectedImageIndex + 1} / {propertyMedia.length}
                            </div>
                        )}

                        {/* Navigation Arrows */}
                        {propertyMedia.length > 1 && (
                            <>
                                <button
                                    onClick={() =>
                                        setSelectedImageIndex((prev) =>
                                            prev === 0 ? propertyMedia.length - 1 : prev - 1
                                        )
                                    }
                                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100"
                                    aria-label="Previous image"
                                >
                                    <svg
                                        className="w-6 h-6"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M15 19l-7-7 7-7"
                                        />
                                    </svg>
                                </button>
                                <button
                                    onClick={() =>
                                        setSelectedImageIndex((prev) =>
                                            prev === propertyMedia.length - 1 ? 0 : prev + 1
                                        )
                                    }
                                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100"
                                    aria-label="Next image"
                                >
                                    <svg
                                        className="w-6 h-6"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 5l7 7-7 7"
                                        />
                                    </svg>
                                </button>
                            </>
                        )}
                    </div>
                    <div>
                        {/* Image Thumbnails */}
                        {propertyMedia.length > 1 && !isPlaceholder && (
                            <div className="relative flex items-center gap-2">
                                {/* Previous Button */}
                                {propertyMedia.length > THUMBNAILS_PER_PAGE &&
                                    thumbnailStartIndex > 0 && (
                                        <button
                                            onClick={() =>
                                                setThumbnailStartIndex((prev) =>
                                                    Math.max(0, prev - THUMBNAILS_PER_PAGE)
                                                )
                                            }
                                            className="flex-shrink-0 bg-white hover:bg-gray-50 text-gray-800 p-2 rounded-full shadow-lg transition-all border border-gray-200"
                                            aria-label="Previous thumbnails"
                                        >
                                            <svg
                                                className="w-5 h-5"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M15 19l-7-7 7-7"
                                                />
                                            </svg>
                                        </button>
                                    )}

                                {/* Thumbnails Grid */}
                                <div className="flex-1 grid grid-cols-6 md:grid-cols-8 gap-2">
                                    {propertyMedia
                                        .slice(
                                            thumbnailStartIndex,
                                            thumbnailStartIndex + THUMBNAILS_PER_PAGE
                                        )
                                        .map((img, relativeIndex) => {
                                            const index = thumbnailStartIndex + relativeIndex;
                                            const isSelected = selectedImageIndex === index;

                                            return (
                                                <button
                                                    key={`${img}-${index}`}
                                                    type="button"
                                                    onClick={() => setSelectedImageIndex(index)}
                                                    className={`relative block h-16 md:h-20 w-full rounded-lg overflow-hidden border-2 transition-all ${
                                                        isSelected
                                                            ? "border-primary-500 ring-2 ring-primary-200"
                                                            : "border-gray-200 hover:border-gray-300"
                                                    }`}
                                                    aria-label={`Select image ${index + 1}`}
                                                    aria-current={isSelected ? "true" : "false"}
                                                >
                                                    <PropertyMedia
                                                        src={img}
                                                        alt={`${title} thumbnail ${index + 1}`}
                                                        fill
                                                        sizes="80px"
                                                        loading="lazy"
                                                        objectFit="cover"
                                                    />
                                                </button>
                                            );
                                        })}
                                </div>

                                {/* Next Button */}
                                {propertyMedia.length > THUMBNAILS_PER_PAGE &&
                                    thumbnailStartIndex + THUMBNAILS_PER_PAGE <
                                        propertyMedia.length && (
                                        <button
                                            onClick={() =>
                                                setThumbnailStartIndex((prev) =>
                                                    Math.min(
                                                        propertyMedia.length - THUMBNAILS_PER_PAGE,
                                                        prev + THUMBNAILS_PER_PAGE
                                                    )
                                                )
                                            }
                                            className="flex-shrink-0 bg-white hover:bg-gray-50 text-gray-800 p-2 rounded-full shadow-lg transition-all border border-gray-200"
                                            aria-label="Next thumbnails"
                                        >
                                            <svg
                                                className="w-5 h-5"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M9 5l7 7-7 7"
                                                />
                                            </svg>
                                        </button>
                                    )}
                            </div>
                        )}
                    </div>
                    {/* Content Section - Full Width */}
                    <div className="space-y-8 mt-8">
                        {/* Description */}
                        <div>
                            <h2 className="text-2xl font-bold text-text mb-4">
                                About the property
                            </h2>
                            <p className="text-text-muted leading-relaxed whitespace-pre-line">
                                {description || "No description available."}
                            </p>
                        </div>

                        {/* Amenities */}
                        {amenities && amenities.length > 0 && (
                            <div>
                                <h2 className="text-2xl font-bold text-text mb-4">Amenities</h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {amenities.map((amenity, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center gap-2 text-text-muted"
                                        >
                                            <svg
                                                className="w-5 h-5 text-primary-600 flex-shrink-0"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M5 13l4 4L19 7"
                                                />
                                            </svg>
                                            <span>{amenity}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar - 1/3 width */}
                <div className="col-span-1">
                    <div className="bg-white border border-border rounded-lg p-6 shadow-lg sticky top-4">
                        <h3 className="text-xl font-bold text-text mb-4">Interested?</h3>
                        <p className="text-text-muted mb-6">
                            Get in touch to schedule a viewing or request more information about
                            this property.
                        </p>
                        <div className="space-y-3">
                            <Button variant="primary" className="w-full">
                                <svg
                                    className="w-5 h-5 mr-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                    />
                                </svg>
                                Contact Landlord
                            </Button>
                            <Button variant="secondary" className="w-full">
                                <svg
                                    className="w-5 h-5 mr-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                </svg>
                                Schedule Viewing
                            </Button>
                            <Button variant="outline" className="w-full">
                                <svg
                                    className="w-5 h-5 mr-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                    />
                                </svg>
                                Save Property
                            </Button>
                        </div>

                        {/* Property Details */}
                        <div className="mt-6 pt-6 border-t border-border">
                            <h4 className="text-sm font-semibold text-text mb-3">
                                Property Details
                            </h4>
                            <div className="space-y-2 text-sm">
                                {property_type && (
                                    <div className="flex justify-between">
                                        <span className="text-text-muted">Type:</span>
                                        <span className="text-text font-medium capitalize">
                                            {property_type}
                                        </span>
                                    </div>
                                )}
                                {furnished !== undefined && (
                                    <div className="flex justify-between">
                                        <span className="text-text-muted">Furnished:</span>
                                        <span className="text-text font-medium">
                                            {furnished ? "Yes" : "No"}
                                        </span>
                                    </div>
                                )}
                                {property.created_at && (
                                    <div className="flex justify-between">
                                        <span className="text-text-muted">Listed:</span>
                                        <span className="text-text font-medium">
                                            {new Date(property.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
