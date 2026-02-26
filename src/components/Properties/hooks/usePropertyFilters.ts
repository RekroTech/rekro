import { useState, useEffect } from "react";

export interface PropertyFilters {
    search: string;
    debouncedSearch: string;
    propertyType: string;
    bedrooms: string;
    bathrooms: string;
    listingType: string;
}

export function usePropertyFilters() {
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
    const [propertyType, setPropertyType] = useState("");
    const [bedrooms, setBedrooms] = useState("");
    const [bathrooms, setBathrooms] = useState("");
    const [listingType, setListingType] = useState("all");

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 300); // 300ms delay

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const clearFilters = () => {
        setSearchQuery("");
        setPropertyType("");
        setBedrooms("");
        setBathrooms("");
        setListingType("all");
    };

    const hasActiveFilters = !!(
        searchQuery ||
        propertyType ||
        bedrooms ||
        bathrooms ||
        listingType
    );

    return {
        filters: {
            searchQuery,
            debouncedSearchQuery,
            propertyType,
            bedrooms,
            bathrooms,
            listingType,
        },
        setters: {
            setSearchQuery,
            setPropertyType,
            setBedrooms,
            setBathrooms,
            setListingType,
        },
        clearFilters,
        hasActiveFilters,
    };
}
