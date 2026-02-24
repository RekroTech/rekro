"use client";

import { useState, Suspense } from "react";
import { PropertyList } from "@/components";
import { Icon, Input, Select, Banner } from "@/components/common";
import { usePropertyFilters, LISTING_TYPES, PROPERTY_TYPES } from "@/components/Property";
import { useRoles } from "@/lib/react-query/hooks/roles";
import { useEmailVerification, VerificationErrorModal } from "@/components/Auth";

// This page needs to be dynamic to show property listings
export const dynamic = "force-dynamic";

function HomePageContent() {
    const { canManageProperties } = useRoles();
    const [showFilters, setShowFilters] = useState(false);

    const {
        filters: {
            searchQuery,
            debouncedSearchQuery,
            propertyType,
            bedrooms,
            bathrooms,
            listingType,
        },
        setters: { setSearchQuery, setPropertyType, setBedrooms, setBathrooms, setListingType },
    } = usePropertyFilters();

    // Email verification handling
    const {
        verified,
        errorInfo,
        isErrorModalOpen,
        handleCloseErrorModal,
        handleTryDifferentEmail,
    } = useEmailVerification();

    return (
        <main className="mx-auto max-w-7xl px-3 py-3 sm:px-4 sm:py-4 md:py-6 lg:px-8 lg:py-8">
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
                    {/* Search Bar with Filter Button (Mobile) */}
                    <div className="flex items-center gap-2 sm:flex-1">
                        <div className="relative flex-1">
                            <Input
                                id="search-input"
                                type="text"
                                placeholder="Search location or property..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                size="sm"
                                leftIcon={<Icon name="search" className="h-4 w-4" />}
                                rightIcon={
                                    searchQuery ? (
                                        <button
                                            type="button"
                                            onClick={() => setSearchQuery("")}
                                            className="text-gray-400 hover:text-gray-600 active:text-gray-700 touch-manipulation"
                                            aria-label="Clear search"
                                        >
                                            <Icon name="x" className="h-4 w-4" />
                                        </button>
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
                    </div>

                    {/* Filters - Toggleable on mobile, always visible inline on desktop */}
                    <div
                        className={`mt-2 sm:mt-0 grid grid-cols-3 gap-2 sm:flex sm:flex-row sm:items-center sm:gap-2 ${showFilters ? "grid" : "hidden sm:flex"}`}
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
                    </div>
                </div>

                {/* Listing type tabs */}
                <div className="mb-4 sm:mb-6 flex justify-center px-1">
                    <div
                        role="tablist"
                        aria-label="Listing type"
                        className="flex items-center gap-1 sm:gap-2 rounded-4xl border border-border bg-card p-1 w-full max-w-md"
                    >
                        {LISTING_TYPES.map((tab) => {
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
                        })}
                    </div>
                </div>

                {/* Property List - Role-based edit buttons */}
                <PropertyList
                    search={debouncedSearchQuery}
                    propertyType={propertyType}
                    minBedrooms={bedrooms ? parseInt(bedrooms) : undefined}
                    minBathrooms={bathrooms ? parseInt(bathrooms) : undefined}
                    listingType={listingType}
                    showEditButton={canManageProperties}
                />
            </div>

            {/* Email Verification Error Modal */}
            <VerificationErrorModal
                isOpen={isErrorModalOpen}
                onClose={handleCloseErrorModal}
                error={errorInfo}
                onTryDifferentEmail={handleTryDifferentEmail}
            />
        </main>
    );
}

export default function HomePage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center">
                    <div className="text-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent mx-auto"></div>
                    </div>
                </div>
            }
        >
            <HomePageContent />
        </Suspense>
    );
}
