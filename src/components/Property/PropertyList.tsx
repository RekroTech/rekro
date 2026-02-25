"use client";

import { useEffect, useRef } from "react";
import { useProperties } from "@/lib/react-query/hooks/property";
import { useSessionUser } from "@/lib/react-query/hooks/auth";
import { PropertyCard } from "@/components";
import { Icon, Loader } from "@/components/common";
import type { Property } from "@/types/property.types";

export interface PropertyListProps {
    search?: string;
    propertyType?: string;
    minBedrooms?: number;
    minBathrooms?: number;
    furnished?: boolean;
    listingType?: string;
    showEditButton?: boolean;
    likedOnly?: boolean;
    emptyMessage?: string;
}

export function PropertyList({
    search,
    propertyType,
    minBedrooms,
    minBathrooms,
    furnished,
    listingType,
    showEditButton = false,
    likedOnly = false,
    emptyMessage,
}: PropertyListProps = {}) {
    const normalizedListingType = listingType && listingType !== "all" ? listingType : undefined;

    const { data: sessionUser, isLoading: sessionUserLoading } = useSessionUser({
        enabled: likedOnly,
    });

    const userId = likedOnly ? sessionUser?.id : undefined;
    const canFetch = !likedOnly || (!!userId && !sessionUserLoading);

    const { data, error, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
        useProperties(
            {
                limit: 12,
                search,
                propertyType,
                minBedrooms,
                minBathrooms,
                furnished,
                listingType: normalizedListingType,
                userId,
                likedOnly,
            },
            { enabled: canFetch }
        );

    const observerTarget = useRef<HTMLDivElement>(null);

    // Infinite scroll observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
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
    if (!canFetch) {
        return (
            <div className="flex justify-center items-center py-12">
                <Loader size="lg" />
            </div>
        );
    }

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
                <Icon name="alert-circle" className="mx-auto h-12 w-12 text-danger-500" />
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
    const allProperties = data?.pages.flatMap((page: { data: Property[] }) => page.data) ?? [];

    // Empty state
    if (allProperties.length === 0) {
        return (
            <div className="text-center py-12">
                <Icon name="home" className="mx-auto h-12 w-12 text-text-muted" />
                <h3 className="mt-4 text-lg font-semibold text-text">No properties found</h3>
                <p className="mt-2 text-sm text-text-muted">
                    {emptyMessage || "Try adjusting your search or filters."}
                </p>
            </div>
        );
    }

    return (
        <div>
            {/* Property Grid */}
            <div className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {allProperties.map((property: Property) => (
                    <PropertyCard
                        key={property.id}
                        property={property}
                        showEditButton={showEditButton}
                    />
                ))}
            </div>

            {/* Intersection Observer Target */}
            <div ref={observerTarget} className="mt-6 sm:mt-8">
                {isFetchingNextPage && (
                    <div className="flex justify-center items-center py-4">
                        <Loader size="md" />
                    </div>
                )}
            </div>

            {/* Scroll to top button */}
            {!hasNextPage && allProperties.length > 0 && (
                <div className="text-center py-6 sm:py-8">
                    <button
                        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                        className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 text-sm font-medium text-primary-600 bg-primary-500/10 hover:bg-primary-500/15 active:bg-primary-500/20 rounded-lg transition-colors touch-manipulation min-h-[44px]"
                    >
                        <Icon name="arrow-up" className="h-5 w-5" />
                        Back to Top
                    </button>
                </div>
            )}
        </div>
    );
}
