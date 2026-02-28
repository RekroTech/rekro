import { useEffect, useState } from "react";
import { useQueryState, parseAsString } from "nuqs";

export interface PropertyFilters {
    search: string;
    debouncedSearch: string;
    propertyType: string;
    bedrooms: string;
    bathrooms: string;
    listingType: string;
}

/**
 * Hook for managing property filters with URL state persistence
 * Filters are synced to URL query params for shareable URLs
 * Example: /?search=sydney&bedrooms=2&propertyType=apartment
 */
export function usePropertyFilters() {
    // URL state management with nuqs - filters persist in URL!
    const [searchQuery, setSearchQuery] = useQueryState(
        "search",
        parseAsString.withDefault("")
    );
    const [propertyType, setPropertyType] = useQueryState(
        "propertyType",
        parseAsString.withDefault("")
    );
    const [bedrooms, setBedrooms] = useQueryState(
        "bedrooms",
        parseAsString.withDefault("")
    );
    const [bathrooms, setBathrooms] = useQueryState(
        "bathrooms",
        parseAsString.withDefault("")
    );
    const [listingType, setListingType] = useQueryState(
        "listingType",
        parseAsString.withDefault("all")
    );

    // Local state for debounced search (don't want to update URL on every keystroke)
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);

    // Debounce search query for API calls
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
        (listingType && listingType !== "all")
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
