"use client";

import { useState, useTransition, Suspense } from "react";
import { PropertyList } from "@/components/Properties/PropertyList";
import { Icon, Input, Select, Banner, PropertyListSkeleton, Loader } from "@/components/common";
import { useRoles } from "@/lib/hooks";
import { useEmailVerification, VerificationErrorModal } from "@/components/Auth";
import { usePropertyFilters } from "@/components/Properties";
import { PropertyMapView } from "@/components/Properties/PropertyMapView";
import { LISTING_TYPES, PROPERTY_TYPES, STATUS_TABS } from "@/components/PropertyForm";
import { UnitStatus } from "@/types/property.types";

// This page needs to be dynamic to show property listings
export const dynamic = "force-dynamic";

function HomePageContent() {
    const { canManageProperties, canManageUsers } = useRoles();
    const [showFilters, setShowFilters] = useState(false);
    const [status, setStatus] = useState<"active" | "leased" | "inactive">("active");
    const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
    const [isPending, startTransition] = useTransition();

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
        // Update input immediately (high priority)
        setSearchQuery(value);

        // The actual filtering happens in usePropertyFilters with debouncing
        // useTransition keeps UI responsive during the re-render
        startTransition(() => {
            // The transition marks this as low-priority work
        });
    };

    return (
        <div className="mx-auto max-w-7xl px-3 py-3 sm:px-4 sm:py-4 md:py-6 lg:px-8 lg:py-8">
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
                {/* Search and Filters */}
                <div className="mb-3 sm:mb-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
                    {/* Search Bar with Filter + View Toggle Buttons (Mobile) */}
                    <div className="flex items-center gap-2 sm:flex-1">
                        <div className="relative flex-1">
                            <Input
                                id="search-input"
                                type="search"
                                aria-label="Search properties by location or name"
                                placeholder="Search location or property..."
                                value={searchQuery}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                size="sm"
                                leftIcon={<Icon name="search" className="h-4 w-4" />}
                                rightIcon={
                                    searchQuery ? (
                                        <button
                                            type="button"
                                            onClick={() => handleSearchChange("")}
                                            className="text-gray-400 hover:text-gray-600 active:text-gray-700 touch-manipulation"
                                            aria-label="Clear search"
                                        >
                                            <Icon name="x" className="h-4 w-4" />
                                        </button>
                                    ) : isPending ? (
                                        <Loader size="sm" />
                                    ) : undefined
                                }
                                fullWidth
                            />
                        </div>
                        {/* Filter Toggle Button - Mobile Only */}
                        <button
                            type="button"
                            onClick={() => setShowFilters(!showFilters)}
                            className="sm:hidden flex items-center justify-center h-10 w-10 rounded-lg border border-border bg-card text-foreground hover:bg-surface-muted active:bg-surface-muted touch-manipulation transition-colors"
                            aria-label="Toggle filters"
                            aria-expanded={showFilters}
                        >
                            <Icon name="filter" className="h-5 w-5" />
                        </button>
                        {/* View Mode Icon Button - Mobile Only */}
                        <button
                            type="button"
                            onClick={() => setViewMode(viewMode === "grid" ? "map" : "grid")}
                            aria-label={viewMode === "grid" ? "Switch to map view" : "Switch to grid view"}
                            className="sm:hidden flex items-center justify-center h-10 w-10 rounded-lg border border-border bg-card text-foreground hover:bg-surface-muted active:bg-surface-muted transition-colors touch-manipulation"
                        >
                            <Icon name={viewMode === "grid" ? "map" : "grid"} className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Filters - Toggleable on mobile, always visible inline on desktop */}
                    <div
                        className={`mt-2 sm:mt-0 grid grid-cols-2 sm:grid-cols-3 gap-2 sm:flex sm:flex-row sm:items-center sm:gap-2 ${showFilters ? "grid" : "hidden sm:flex"}`}
                    >
                        {/* Property Type */}
                        <Select
                            id="property-type-filter"
                            value={propertyType}
                            onChange={(e) => setPropertyType(e.target.value)}
                            size="sm"
                            label="Property Type"
                            options={PROPERTY_TYPES}
                            fullWidth={false}
                            className="w-full sm:flex-none sm:w-[140px]"
                        />

                        {/* Bedrooms */}
                        <Select
                            id="bedrooms-filter"
                            value={bedrooms}
                            onChange={(e) => setBedrooms(e.target.value)}
                            size="sm"
                            label="Bedrooms"
                            options={[
                                { value: "", label: "Any" },
                                { value: "1", label: "1 Bed" },
                                { value: "2", label: "2 Beds" },
                                { value: "3", label: "3 Beds" },
                                { value: "4", label: "4+ Beds" },
                            ]}
                            fullWidth={false}
                            className="w-full sm:flex-none sm:w-[110px]"
                        />

                        {/* Bathrooms */}
                        <Select
                            id="bathrooms-filter"
                            value={bathrooms}
                            onChange={(e) => setBathrooms(e.target.value)}
                            size="sm"
                            label="Bathrooms"
                            options={[
                                { value: "", label: "Any" },
                                { value: "1", label: "1 Bath" },
                                { value: "2", label: "2 Baths" },
                                { value: "3", label: "3+ Baths" },
                            ]}
                            fullWidth={false}
                            className="w-full sm:flex-none sm:w-[110px]"
                        />

                        {/* Min Price */}
                        <Select
                            id="min-price-filter"
                            value={minPrice}
                            onChange={(e) => setMinPrice(e.target.value)}
                            size="sm"
                            label="Min Rent"
                            options={[
                                { value: "", label: "Any" },
                                { value: "100", label: "$100/wk" },
                                { value: "200", label: "$200/wk" },
                                { value: "300", label: "$300/wk" },
                                { value: "400", label: "$400/wk" },
                                { value: "500", label: "$500/wk" },
                                { value: "600", label: "$600/wk" },
                                { value: "800", label: "$800/wk" },
                                { value: "1000", label: "$1,000/wk" },
                            ]}
                            fullWidth={false}
                            className="w-full sm:flex-none sm:w-[120px]"
                        />

                        {/* Max Rent */}
                        <Select
                            id="max-price-filter"
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(e.target.value)}
                            size="sm"
                            label="Max Rent"
                            options={[
                                { value: "", label: "Any" },
                                { value: "200", label: "$200/wk" },
                                { value: "300", label: "$300/wk" },
                                { value: "400", label: "$400/wk" },
                                { value: "500", label: "$500/wk" },
                                { value: "600", label: "$600/wk" },
                                { value: "800", label: "$800/wk" },
                                { value: "1000", label: "$1,000/wk" },
                                { value: "1500", label: "$1,500/wk" },
                                { value: "2000", label: "$2,000/wk" },
                            ]}
                            fullWidth={false}
                            className="w-full sm:flex-none sm:w-[120px]"
                        />

                        {/* Furnished */}
                        <div className="col-span-2 sm:col-span-1 sm:flex-none">
                            <Select
                                id="furnished-filter"
                                value={furnishedFilter}
                                onChange={(e) => setFurnishedFilter(e.target.value)}
                                size="sm"
                                label="Furnished"
                                options={[
                                    { value: "", label: "Any" },
                                    { value: "furnished", label: "Furnished" },
                                    { value: "unfurnished", label: "Unfurnished" },
                                ]}
                                fullWidth={false}
                                className="w-full sm:flex-none sm:w-[130px]"
                            />
                        </div>


                    </div>
                </div>

                {/* Listing type tabs - Show admin tabs if user can manage users (admin) */}
                <div className="mb-4 sm:mb-6 flex items-center px-1">
                    {/* Spacer to keep tabs centered on desktop */}
                    <div className="hidden sm:flex flex-1" />
                    <div
                        role="tablist"
                        aria-label={canManageUsers ? "Property status" : "Listing type"}
                        className="flex items-center gap-1 sm:gap-2 rounded-4xl border border-border bg-card p-1 w-full max-w-md"
                    >
                        {canManageUsers ? (
                            // Admin tabs: Active, Leased, Inactive
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
                                        className={
                                            "flex-1 rounded-4xl px-3 py-2 text-xs sm:text-sm font-medium text-center transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 whitespace-nowrap touch-manipulation " +
                                            (isActive
                                                ? "bg-primary-600 text-white ring-2 ring-primary-500"
                                                : "bg-card text-foreground hover:bg-surface-muted active:bg-surface-muted")
                                        }
                                    >
                                        {tab.label}
                                    </button>
                                );
                            })
                        ) : (
                            // Regular user tabs: All, Entire Home, Private Room
                            LISTING_TYPES.map((tab) => {
                                const isActive = listingType === tab.value;
                                return (
                                    <button
                                        key={tab.value}
                                        type="button"
                                        role="tab"
                                        aria-selected={isActive}
                                        tabIndex={isActive ? 0 : -1}
                                        onClick={() => setListingType(tab.value)}
                                        className={
                                            "flex-1 rounded-4xl px-3 py-2 text-xs sm:text-sm font-medium text-center transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 whitespace-nowrap touch-manipulation " +
                                            (isActive
                                                ? "bg-primary-600 text-white ring-2 ring-primary-500"
                                                : "bg-card text-foreground hover:bg-surface-muted active:bg-surface-muted")
                                        }
                                    >
                                        {tab.label}
                                    </button>
                                );
                            })
                        )}
                    </div>

                    {/* Grid/Map toggle - right side, desktop only */}
                    <div className="hidden sm:flex flex-1 justify-end">
                        <div
                            role="group"
                            aria-label="View mode"
                            className="flex items-center rounded-full border border-border bg-card p-1 shrink-0"
                        >
                            <button
                                type="button"
                                aria-pressed={viewMode === "grid"}
                                onClick={() => setViewMode("grid")}
                                className={
                                    "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all focus:outline-none" +
                                    (viewMode === "grid"
                                        ? "bg-white shadow-sm text-foreground dark:bg-surface-muted"
                                        : "text-text-muted hover:text-foreground")
                                }
                            >
                                <Icon name="grid" className="h-3.5 w-3.5" />
                                Grid
                            </button>
                            <button
                                type="button"
                                aria-pressed={viewMode === "map"}
                                onClick={() => setViewMode("map")}
                                className={
                                    "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all focus:outline-none" +
                                    (viewMode === "map"
                                        ? "bg-white shadow-sm text-foreground dark:bg-surface-muted"
                                        : "text-text-muted hover:text-foreground")
                                }
                            >
                                <Icon name="map" className="h-3.5 w-3.5" />
                                Map
                            </button>
                        </div>
                    </div>
                </div>

                {/* Property List or Map - Role-based edit buttons */}
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
                    />
                ) : (
                    <PropertyMapView
                        search={debouncedSearchQuery}
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
