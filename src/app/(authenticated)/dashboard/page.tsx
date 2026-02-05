"use client";

import { useState } from "react";
import { PropertyList, PropertyForm } from "@/components";
import { Button, Icon } from "@/components/common";
import { usePropertyFilters } from "./usePropertyFilters";

export default function DashboardPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const {
        filters: { searchQuery, debouncedSearchQuery, propertyType, bedrooms, bathrooms },
        setters: { setSearchQuery, setPropertyType, setBedrooms, setBathrooms },
    } = usePropertyFilters();

    return (
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {/* Property Listings Section */}
            <div className="mb-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-3xl font-bold text-text">Available Properties</h2>
                    <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                        <Icon name="plus" className="h-5 w-5 mr-2" />
                        Add Property
                    </Button>
                </div>

                {/* Search and Filters */}
                <div className="mb-8 flex items-center gap-2 sm:gap-3">
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
                    <div className="flex items-center gap-2">
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

                {/* Property List */}
                <PropertyList
                    search={debouncedSearchQuery}
                    propertyType={propertyType}
                    minBedrooms={bedrooms ? parseInt(bedrooms, 10) : undefined}
                    minBathrooms={bathrooms ? parseInt(bathrooms, 10) : undefined}
                />
            </div>

            <PropertyForm isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </main>
    );
}
