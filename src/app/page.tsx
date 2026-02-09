"use client";

import { PropertyList } from "@/components";
import { Icon } from "@/components/common";
import { usePropertyFilters } from "@/components/Property/hooks";
import { LISTING_TYPES } from "@/components/Property/constants";
import { useUser } from "@/lib/react-query/hooks/auth/useAuth";
import { useCanManageProperties } from "@/hooks/useRoles";

// This page needs to be dynamic to show property listings
export const dynamic = "force-dynamic";

export default function HomePage() {
    const { data: user } = useUser();
    const canManageProperties = useCanManageProperties(user ?? null);

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

    return (
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {/* Property Listings Section */}
            <div className="mb-8">
                {/* Search and Filters */}
                <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
                    {/* Search Bar */}
                    <div className="relative w-full">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <Icon name="search" className="h-4 w-4" />
                        </div>
                        <input
                            id="search-input"
                            type="text"
                            placeholder="Search by location, address, or property name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-10 py-2.5 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                aria-label="Clear search"
                            >
                                <Icon name="x" className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2">
                        {/* Property Type */}
                        <div className="relative">
                            <label
                                htmlFor="property-type-filter"
                                className="absolute left-3 px-1.5 bg-white text-xs font-medium text-gray-400 z-10 -translate-y-1/2"
                            >
                                Property Type
                            </label>
                            <select
                                id="property-type-filter"
                                value={propertyType}
                                onChange={(e) => setPropertyType(e.target.value)}
                                className="flex-1 sm:flex-none sm:w-[140px] px-3 py-2.5 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                            >
                                <option value="">Any</option>
                                <option value="house">House</option>
                                <option value="apartment">Apartment</option>
                                <option value="townhouse">Townhouse</option>
                                <option value="villa">Villa</option>
                                <option value="studio">Studio</option>
                                <option value="land">Land</option>
                            </select>
                        </div>

                        {/* Bedrooms */}
                        <div className="relative">
                            <label
                                htmlFor="bedrooms-filter"
                                className="absolute left-3 px-1.5 bg-white text-xs font-medium text-gray-400 z-10 -translate-y-1/2"
                            >
                                Bedrooms
                            </label>
                            <select
                                id="bedrooms-filter"
                                value={bedrooms}
                                onChange={(e) => setBedrooms(e.target.value)}
                                className="flex-1 sm:flex-none sm:w-[110px] px-3 py-2.5 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                            >
                                <option value="">Any</option>
                                <option value="1">1 Bed</option>
                                <option value="2">2 Beds</option>
                                <option value="3">3 Beds</option>
                                <option value="4">4+ Beds</option>
                            </select>
                        </div>

                        {/* Bathrooms */}
                        <div className="relative">
                            <label
                                htmlFor="bathrooms-filter"
                                className="absolute left-3 px-1.5 bg-white text-xs font-medium text-gray-400 z-10 -translate-y-1/2"
                            >
                                Bathrooms
                            </label>
                            <select
                                id="bathrooms-filter"
                                value={bathrooms}
                                onChange={(e) => setBathrooms(e.target.value)}
                                className="flex-1 sm:flex-none sm:w-[110px] px-3 py-2.5 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                            >
                                <option value="">Any</option>
                                <option value="1">1 Bath</option>
                                <option value="2">2 Baths</option>
                                <option value="3">3+ Baths</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Listing type tabs */}
                <div className="mb-6 flex justify-center">
                    <div
                        role="tablist"
                        aria-label="Listing type"
                        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-1"
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
                                        "flex-1 rounded-md px-6 py-2 text-sm font-medium text-center transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 whitespace-nowrap " +
                                        (isActive
                                            ? "bg-primary-600 text-white"
                                            : "bg-white text-gray-700 hover:bg-gray-50")
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
        </main>
    );
}
