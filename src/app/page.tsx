"use client";

import { useState, useTransition, useRef, useEffect, Suspense } from "react";
import { Filter, Grid3X3, Map, Search, X } from "lucide-react";
import { useQueryState, parseAsStringLiteral } from "nuqs";
import clsx from "clsx";
import { PropertyList } from "@/components/Properties/PropertyList";
import { Icon, Input, Banner, PropertyListSkeleton, Loader } from "@/components/common";
import { useRoles } from "@/lib/hooks";
import { usePlacesAutocomplete } from "@/hooks";
import type { PlaceSelection } from "@/hooks";
import { useEmailVerification, VerificationErrorModal } from "@/components/Auth";
import { usePropertyFilters } from "@/components/Properties";
import { FilterDropdown } from "@/components/Properties/FilterDropdown";
import type { FilterValues } from "@/components/Properties/FilterDropdown";
import { PropertyMapView } from "@/components/Properties/PropertyMapView";
import { LISTING_TYPES, STATUS_TABS } from "@/components/PropertyForm";
import { ListingTab, UnitStatus } from "@/types/property.types";

// This page needs to be dynamic to show property listings
export const dynamic = "force-dynamic";

function HomePageContent() {
    const { canManageProperties, canManageUsers } = useRoles();
    const [status, setStatus] = useQueryState(
        "status",
        parseAsStringLiteral(["active", "leased", "inactive"] as const).withDefault("active")
    );
    const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
    const [isPending, startTransition] = useTransition();
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [mapDirectFlyTo, setMapDirectFlyTo] = useState<{ lat: number; lng: number } | null>(null);
    const filterAnchorRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Attach Google Places Autocomplete to the search input in both grid and map views
    usePlacesAutocomplete({
        inputRef: searchInputRef,
        enabled: true,
        onValueChange: (val) => handleSearchChange(val),
        onPlaceSelect: (place: PlaceSelection) => {
            handleSearchChange(place.description);
            // Only fly to location when in map view
            if (viewMode === "map") {
                setMapDirectFlyTo({ lat: place.lat, lng: place.lng });
            }
        },
    });

    const {
        filters: {
            searchQuery,
            debouncedSearchQuery,
            propertyType,
            bedrooms,
            bathrooms,
            listingType,
            minPrice,
            maxPrice,
            furnishedFilter,
        },
        setters: { setSearchQuery, setPropertyType, setBedrooms, setBathrooms, setListingType, setMinPrice, setMaxPrice, setFurnishedFilter },
    } = usePropertyFilters();

    // Email verification handling
    const {
        verified,
        errorInfo,
        isErrorModalOpen,
        handleCloseErrorModal,
        handleTryDifferentEmail,
    } = useEmailVerification();

    // Handle search with transition for better UX
    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        startTransition(() => {});
    };

    // Count active non-search filters for the badge
    const activeFilterCount = [propertyType, bedrooms, bathrooms, minPrice, maxPrice, furnishedFilter].filter(Boolean).length;

    // Close filter dropdown on outside click — filterAnchorRef wraps both the
    // trigger button and the dropdown panel, so clicking the trigger itself does
    // NOT trigger this handler (preventing the close→reopen race condition).
    useEffect(() => {
        if (!showFilterDropdown) return;
        function handleOutside(e: MouseEvent) {
            if (filterAnchorRef.current && !filterAnchorRef.current.contains(e.target as Node)) {
                setShowFilterDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleOutside);
        return () => document.removeEventListener("mousedown", handleOutside);
    }, [showFilterDropdown]);

    // Apply pending filter values from the dropdown
    const handleApplyFilters = (values: FilterValues) => {
        setPropertyType(values.propertyType);
        setBedrooms(values.bedrooms);
        setBathrooms(values.bathrooms);
        setMinPrice(values.minPrice);
        setMaxPrice(values.maxPrice);
        setFurnishedFilter(values.furnishedFilter);
    };

    return (
        <div className="mx-auto max-w-7xl px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6 lg:px-8 lg:py-8">
            {/* Page Title - Visually hidden but accessible to screen readers */}
            <h1 className="sr-only">Property Listings</h1>

            {/* Email Verification Success Banner */}
            {verified && (
                <Banner
                    variant="success"
                    title="Email verified successfully!"
                    message="Redirecting you to your dashboard..."
                    className="mb-4 sm:mb-6"
                />
            )}

            {/* Property Listings Section */}
            <div className="mb-6 sm:mb-8">
                {/* Search, Filters button, and View toggle — single row on all screen sizes */}
                <div className="mb-3 sm:mb-4 flex items-center gap-2">
                    {/* Search Input */}
                    <div className="relative flex-1">
                        <Input
                            ref={searchInputRef}
                            id="search-input"
                            type="search"
                            aria-label={
                                viewMode === "map"
                                    ? "Navigate map by suburb, postcode or address"
                                    : "Search properties by location or name"
                            }
                            placeholder={
                                viewMode === "map"
                                    ? "Suburb, city, street or postcode…"
                                    : "Search location or property..."
                            }
                            value={searchQuery}
                            onChange={(e) => {
                                handleSearchChange(e.target.value);
                                // Clear stored coords when user types freely
                                if (mapDirectFlyTo) setMapDirectFlyTo(null);
                            }}
                            size="sm"
                            leftIcon={<Icon icon={Search} size={16} />}
                            rightIcon={
                                searchQuery ? (
                                    <button
                                        type="button"
                                        onClick={() => handleSearchChange("")}
                                        className="text-gray-400 hover:text-gray-600 active:text-gray-700 touch-manipulation"
                                        aria-label="Clear search"
                                    >
                                        <Icon icon={X} size={16} />
                                    </button>
                                ) : isPending ? (
                                    <Loader size="sm" />
                                ) : undefined
                            }
                            fullWidth
                        />
                    </div>

                    {/* Filters + Map/Grid share one relative wrapper so the dropdown's
                        right-0 anchors to the true right edge of this group,
                        keeping it fully within the viewport on all screen sizes. */}
                    <div ref={filterAnchorRef} className="relative flex items-center gap-2">
                        {/* Filters Button */}
                        <button
                            type="button"
                            onClick={() => setShowFilterDropdown((v) => !v)}
                            aria-label="Toggle filters"
                            aria-expanded={showFilterDropdown}
                            className={clsx(
                                "flex items-center gap-1.5 h-10 rounded-lg border px-3 text-sm font-medium transition-colors touch-manipulation",
                                showFilterDropdown || activeFilterCount > 0
                                    ? "border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300"
                                    : "border-border bg-card text-foreground hover:bg-surface-muted active:bg-surface-muted"
                            )}
                        >
                            <Icon icon={Filter} size={16} className="flex-shrink-0" />
                            <span className="hidden sm:inline">Filters</span>
                            {activeFilterCount > 0 && (
                                <span className="flex items-center justify-center h-4.5 min-w-[1.125rem] rounded-full bg-primary-600 px-1 text-[10px] font-bold text-white leading-none">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>

                        {/* Map / Grid toggle */}
                        <button
                            type="button"
                            onClick={() => {
                                setViewMode(viewMode === "grid" ? "map" : "grid");
                                setShowFilterDropdown(false);
                            }}
                            aria-label={viewMode === "grid" ? "Switch to map view" : "Switch to grid view"}
                            className="flex items-center gap-1.5 h-10 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground hover:bg-surface-muted active:bg-surface-muted transition-colors touch-manipulation"
                        >
                            <Icon icon={viewMode === "grid" ? Map : Grid3X3} size={16} className="flex-shrink-0" />
                            <span className="hidden sm:inline">{viewMode === "grid" ? "Map" : "Grid"}</span>
                        </button>

                        {/* Dropdown anchored right-0 of this wrapper = screen right edge */}
                        <FilterDropdown
                            isOpen={showFilterDropdown}
                            onClose={() => setShowFilterDropdown(false)}
                            initialValues={{ propertyType, bedrooms, bathrooms, minPrice, maxPrice, furnishedFilter }}
                            onApply={handleApplyFilters}
                        />
                    </div>
                </div>

                {/* Listing type tabs */}
                <div className="mb-4 sm:mb-6 flex items-center justify-center px-1">
                    <div
                        role="tablist"
                        aria-label={canManageUsers ? "Property status" : "Listing type"}
                        className="flex items-center gap-1 sm:gap-2 rounded-4xl border border-border bg-card p-1 w-full max-w-md"
                    >
                        {canManageUsers ? (
                            STATUS_TABS.map((tab) => {
                                const isActive = status === tab.value;
                                return (
                                    <button
                                        key={tab.value}
                                        type="button"
                                        role="tab"
                                        aria-selected={isActive}
                                        tabIndex={isActive ? 0 : -1}
                                        onClick={() => setStatus(tab.value as UnitStatus)}
                                        className={clsx(
                                            "flex-1 rounded-4xl px-3 py-2 text-xs sm:text-sm font-medium text-center",
                                            "transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500",
                                            "whitespace-nowrap touch-manipulation",
                                            isActive
                                                ? "bg-primary-600 text-white ring-2 ring-primary-500"
                                                : "bg-card text-foreground hover:bg-surface-muted active:bg-surface-muted"
                                        )}
                                    >
                                        {tab.label}
                                    </button>
                                );
                            })
                        ) : (
                            LISTING_TYPES.map((tab) => {
                                const isActive = listingType === tab.value;
                                return (
                                    <button
                                        key={tab.value}
                                        type="button"
                                        role="tab"
                                        aria-selected={isActive}
                                        tabIndex={isActive ? 0 : -1}
                                        onClick={() => setListingType(tab.value as ListingTab)}
                                        className={clsx(
                                            "flex-1 rounded-4xl px-3 py-2 text-xs sm:text-sm font-medium text-center",
                                            "transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500",
                                            "whitespace-nowrap touch-manipulation",
                                            isActive
                                                ? "bg-primary-600 text-white ring-2 ring-primary-500"
                                                : "bg-card text-foreground hover:bg-surface-muted active:bg-surface-muted"
                                        )}
                                    >
                                        {tab.label}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Property List or Map */}
                {viewMode === "grid" ? (
                    <PropertyList
                        search={debouncedSearchQuery}
                        propertyType={propertyType}
                        minBedrooms={bedrooms ? parseInt(bedrooms) : undefined}
                        minBathrooms={bathrooms ? parseInt(bathrooms) : undefined}
                        minPrice={minPrice ? parseInt(minPrice) : undefined}
                        maxPrice={maxPrice ? parseInt(maxPrice) : undefined}
                        furnished={furnishedFilter === "furnished" ? true : furnishedFilter === "unfurnished" ? false : undefined}
                        listingType={canManageUsers ? undefined : listingType}
                        status={canManageUsers ? status ?? undefined : undefined}
                        showEditButton={canManageProperties}
                        // Admin sees every unit price; regular users mirror their active listing-type tab
                        priceDisplayMode={canManageProperties ? "all" : (listingType as ListingTab)}
                    />
                ) : (
                    <PropertyMapView
                        search={debouncedSearchQuery}
                        directFlyTo={mapDirectFlyTo}
                        propertyType={propertyType}
                        minBedrooms={bedrooms ? parseInt(bedrooms) : undefined}
                        minBathrooms={bathrooms ? parseInt(bathrooms) : undefined}
                        minPrice={minPrice ? parseInt(minPrice) : undefined}
                        maxPrice={maxPrice ? parseInt(maxPrice) : undefined}
                        furnished={furnishedFilter === "furnished" ? true : furnishedFilter === "unfurnished" ? false : undefined}
                        listingType={canManageUsers ? undefined : listingType}
                        status={canManageUsers ? status ?? undefined : undefined}
                    />
                )}
            </div>

            {/* Email Verification Error Modal */}
            <VerificationErrorModal
                isOpen={isErrorModalOpen}
                onClose={handleCloseErrorModal}
                error={errorInfo}
                onTryDifferentEmail={handleTryDifferentEmail}
            />
        </div>
    );
}

export default function HomePage() {
    return (
        <Suspense
            fallback={
                <div className="mx-auto max-w-7xl px-3 py-3 sm:px-4 sm:py-4 md:py-6 lg:px-8 lg:py-8">
                    <PropertyListSkeleton count={12} />
                </div>
            }
        >
            <HomePageContent />
        </Suspense>
    );
}
