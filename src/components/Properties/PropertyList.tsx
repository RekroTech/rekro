"use client";

import React, { useEffect, useMemo, useRef } from "react";
import type { Property } from "@/types/property.types";
import { useProperties, useSessionUser } from "@/lib/hooks";
import { Icon, Loader } from "@/components/common";
import { PropertyCard } from "./PropertyCard";
import { PropertyListSkeleton } from "@/components/common/Skeleton";

export interface PropertyListProps {
    search?: string;
    propertyType?: string;
    minBedrooms?: number;
    minBathrooms?: number;
    furnished?: boolean;
    listingType?: string;
    status?: "active" | "leased" | "inactive";
    showEditButton?: boolean;
    likedOnly?: boolean;
    emptyMessage?: string;
    emptyStateAction?: React.ReactNode;
}


export function PropertyList({
    search,
    propertyType,
    minBedrooms,
    minBathrooms,
    furnished,
    listingType,
    status,
    showEditButton = false,
    likedOnly = false,
    emptyMessage,
    emptyStateAction,
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
                status,
                userId,
                likedOnly,
            },
            { enabled: canFetch }
        );
    const allProperties = useMemo(
        () => data?.pages.flatMap((page: { data: Property[] }) => page.data) ?? [],
        [data]
    );

    const observerTarget = useRef<HTMLDivElement>(null);

    // Simple infinite scroll with IntersectionObserver
    useEffect(() => {
        if (!observerTarget.current || !hasNextPage || isFetchingNextPage) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) {
                    fetchNextPage();
                }
            },
            { threshold: 0.1, rootMargin: "200px" }
        );

        observer.observe(observerTarget.current);

        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    // Loading state - show skeleton grid instead of spinner
    if (!canFetch || isLoading) {
        return <PropertyListSkeleton count={12} />;
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

    // Empty state
    if (allProperties.length === 0) {
        return (
            <div className="text-center py-12">
                <Icon name="home" className="mx-auto h-12 w-12 text-text-muted" />
                <h3 className="mt-4 text-lg font-semibold text-text">No properties found</h3>
                <p className="mt-2 text-sm text-text-muted">
                    {emptyMessage || "Try adjusting your search or filters."}
                </p>
                {emptyStateAction && <div className="mt-6">{emptyStateAction}</div>}
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Simple responsive grid - works perfectly on all screen sizes */}
            <div className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {allProperties.map((property: Property) => (
                    <PropertyCard
                        key={property.id}
                        property={property}
                        showEditButton={showEditButton}
                    />
                ))}
            </div>

            {/* Infinite scroll trigger */}
            <div ref={observerTarget} className="mt-6 sm:mt-8 h-12" />

            {/* Loading indicator */}
            {isFetchingNextPage && (
                <div className="flex justify-center items-center py-4">
                    <Loader size="md" />
                </div>
            )}

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
