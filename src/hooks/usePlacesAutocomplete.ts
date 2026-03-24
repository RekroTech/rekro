"use client";

import { useEffect, useRef, useCallback } from "react";
import { loadGoogleMapsScript } from "@/lib/utils/googleMaps";

export interface PlaceSelection {
    description: string;
    lat: number;
    lng: number;
}

export interface UsePlacesAutocompleteOptions {
    /** Ref to the <input> element the widget should attach to. */
    inputRef: React.RefObject<HTMLInputElement | null>;
    /** Called when the user picks a suggestion — includes geocoordinates. */
    onPlaceSelect?: (place: PlaceSelection) => void;
    /** Called with the formatted address string when a place is selected. */
    onValueChange?: (value: string) => void;
    /**
     * Restrict suggestions to a country (ISO 3166-1 alpha-2).
     * Defaults to "au".
     */
    country?: string;
    /** Only activate the autocomplete when true. */
    enabled?: boolean;
}

/**
 * Attaches a Google Maps Places Autocomplete widget to an existing <input> ref.
 * Follows the same pattern as the Address component, using types: ["geocode"] so
 * suggestions cover suburbs, cities, streets, postcodes — not just full addresses.
 */
export function usePlacesAutocomplete({
    inputRef,
    onPlaceSelect,
    onValueChange,
    country = "au",
    enabled = true,
}: UsePlacesAutocompleteOptions) {
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

    const handlePlaceChanged = useCallback(() => {
        const autocomplete = autocompleteRef.current;
        if (!autocomplete) return;

        const place = autocomplete.getPlace();
        if (!place) return;

        const description = place.formatted_address ?? place.name ?? "";

        if (onValueChange) onValueChange(description);

        if (onPlaceSelect && place.geometry?.location) {
            onPlaceSelect({
                description,
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
            });
        }
    }, [onPlaceSelect, onValueChange]);

    useEffect(() => {
        if (!enabled) return;

        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey) return;

        let listener: google.maps.MapsEventListener | null = null;

        loadGoogleMapsScript(apiKey).then(() => {
            const input = inputRef.current;
            if (!input || !window.google?.maps?.places) return;

            const autocomplete = new google.maps.places.Autocomplete(input, {
                componentRestrictions: { country: [country] },
                // "geocode" covers city, suburb, street, postcode
                types: ["geocode"],
                fields: ["formatted_address", "geometry", "name"],
            });

            autocompleteRef.current = autocomplete;
            listener = autocomplete.addListener("place_changed", handlePlaceChanged);
        });

        return () => {
            listener?.remove();
            autocompleteRef.current = null;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, country]);
    // ^ handlePlaceChanged is intentionally excluded — it's stable via useCallback
    //   but re-attaching the widget every render would break the autocomplete session.
}

