import { useState, useEffect } from "react";

export interface PropertyFilters {
    search: string;
    debouncedSearch: string;
    propertyType: string;
    bedrooms: string;
    bathrooms: string;
}

export function usePropertyFilters() {
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
    const [propertyType, setPropertyType] = useState("");
    const [bedrooms, setBedrooms] = useState("");
    const [bathrooms, setBathrooms] = useState("");

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
    };

    const hasActiveFilters = !!(searchQuery || propertyType || bedrooms || bathrooms);

    return {
        filters: {
            searchQuery,
            debouncedSearchQuery,
            propertyType,
            bedrooms,
            bathrooms,
        },
        setters: {
            setSearchQuery,
            setPropertyType,
            setBedrooms,
            setBathrooms,
        },
        clearFilters,
        hasActiveFilters,
    };
}
