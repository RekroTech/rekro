"use client";

import { useEffect, useRef } from "react";
import { useProperties } from "@/lib/react-query/hooks/useProperties";
import { PropertyCard } from "@/components";
import { Loader } from "@/components/common";

export interface PropertyListProps {
    search?: string;
    propertyType?: string;
    minBedrooms?: number;
    minBathrooms?: number;
    furnished?: boolean;
}

export function PropertyList({
    search,
    propertyType,
    minBedrooms,
    minBathrooms,
    furnished,
}: PropertyListProps = {}) {
    const { data, error, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
        useProperties({ limit: 12, search, propertyType, minBedrooms, minBathrooms, furnished });

    const observerTarget = useRef<HTMLDivElement>(null);

    // Infinite scroll observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { threshold: 0.1 }
        );

        const currentTarget = observerTarget.current;
        if (currentTarget) {
            observer.observe(currentTarget);
        }

        return () => {
            if (currentTarget) {
                observer.unobserve(currentTarget);
            }
        };
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    // Loading state
    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-12">
                <Loader size="lg" />
            </div>
        );
    }

    // Error state
    if (isError) {
        return (
            <div className="rounded-[var(--radius-lg)] border border-danger-500 bg-danger-50 p-6 text-center">
                <svg
                    className="mx-auto h-12 w-12 text-danger-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
                <h3 className="mt-4 text-lg font-semibold text-danger-700">
                    Error loading properties
                </h3>
                <p className="mt-2 text-sm text-danger-600">
                    {error?.message || "An unexpected error occurred"}
                </p>
            </div>
        );
    }

    // Get all properties from all pages
    const allProperties = data?.pages.flatMap((page) => page.data) ?? [];

    // Empty state
    if (allProperties.length === 0) {
        return (
            <div className="text-center py-12">
                <svg
                    className="mx-auto h-12 w-12 text-text-muted"
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
                <h3 className="mt-4 text-lg font-semibold text-text">No properties found</h3>
                <p className="mt-2 text-sm text-text-muted">
                    Try adjusting your search or filters.
                </p>
            </div>
        );
    }

    return (
        <div>
            {/* Property Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {allProperties.map((property) => (
                    <PropertyCard key={property.id} property={property} showEditButton={true} />
                ))}
            </div>

            {/* Intersection Observer Target */}
            <div ref={observerTarget} className="h-10 mt-8">
                {isFetchingNextPage && (
                    <div className="flex justify-center items-center">
                        <Loader size="md" />
                    </div>
                )}
            </div>

            {/* Scroll to top button */}
            {!hasNextPage && allProperties.length > 0 && (
                <div className="text-center py-8">
                    <button
                        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                        className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
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
                                d="M5 10l7-7m0 0l7 7m-7-7v18"
                            />
                        </svg>
                        Back to Top
                    </button>
                </div>
            )}
        </div>
    );
}
