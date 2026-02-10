"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { loadGoogleMapsScript } from "@/lib/utils/googleMaps";

interface AddressComponents {
    street_number?: string;
    route?: string;
    locality?: string;
    administrative_area_level_1?: string;
    postal_code?: string;
    country?: string;
    coordinates?: { lat: number; lng: number };
}

interface AddressAutocompleteProps {
    label: string;
    value?: string; // Made optional since we're not using it with the new component
    onChange: (value: string) => void;
    onAddressSelect: (addressComponents: AddressComponents) => void;
    placeholder?: string;
    disabled?: boolean;
    error?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export function Address({
    label,
    value,
    onChange,
    onAddressSelect,
    placeholder,
    disabled,
    error,
    leftIcon,
    rightIcon,
}: AddressAutocompleteProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
    const [isScriptLoaded, setIsScriptLoaded] = useState(false);

    const parsePlace = useCallback((place: google.maps.places.PlaceResult) => {
        const addressComponents: AddressComponents = {};

        if (place.address_components) {
            place.address_components.forEach((component) => {
                const type = component.types?.[0];
                switch (type) {
                    case "street_number":
                        addressComponents.street_number = component.long_name || "";
                        break;
                    case "route":
                        addressComponents.route = component.long_name || "";
                        break;
                    case "locality":
                        addressComponents.locality = component.long_name || "";
                        break;
                    case "administrative_area_level_1":
                        addressComponents.administrative_area_level_1 = component.short_name || "";
                        break;
                    case "postal_code":
                        addressComponents.postal_code = component.long_name || "";
                        break;
                    case "country":
                        addressComponents.country = component.long_name || "";
                        break;
                }
            });
        }

        if (place.geometry?.location) {
            addressComponents.coordinates = {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
            };
        }

        return addressComponents;
    }, []);

    // Load Google Maps script
    useEffect(() => {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

        if (!apiKey) {
            console.warn(
                "Google Maps API key is not configured. Address autocomplete will not work."
            );
            return;
        }

        loadGoogleMapsScript(apiKey)
            .then(() => setIsScriptLoaded(true))
            .catch((error) => console.error("Failed to load Google Maps:", error));
    }, []);

    useEffect(() => {
        if (
            !inputRef.current ||
            !isScriptLoaded ||
            typeof window === "undefined" ||
            !window.google ||
            !window.google.maps ||
            !window.google.maps.places
        ) {
            return;
        }

        const input = inputRef.current;

        // Classic Autocomplete attaches to our real <input> (no Shadow DOM focus-ring overlays).
        const autocomplete = new google.maps.places.Autocomplete(input, {
            componentRestrictions: { country: ["au"] },
            fields: ["address_components", "formatted_address", "geometry"],
            types: ["address"],
        });

        autocompleteRef.current = autocomplete;

        const listener = autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            if (!place) return;

            if (place.formatted_address) {
                onChange(place.formatted_address);
            }

            onAddressSelect(parsePlace(place));
        });

        return () => {
            if (listener) listener.remove();
            autocompleteRef.current = null;
        };
    }, [isScriptLoaded, onChange, onAddressSelect, parsePlace]);

    return (
        <div className="w-full">
            {label && <label className="block text-sm font-medium text-text mb-2">{label}</label>}
            <div
                className={`
                    relative w-full
                    bg-input-bg border border-input-border
                    rounded-[var(--radius-input)]
                    transition-all duration-200
                    overflow-hidden
                    ${
                        error
                            ? "border-danger-500 focus-within:border-danger-600 focus-within:shadow-[0_0_0_4px_rgba(255,59,48,0.1)]"
                            : "focus-within:border-primary-500 focus-within:shadow-[0_0_0_4px_var(--primary-100)]"
                    }
                    ${disabled ? "opacity-50" : ""}
                `}
            >
                {leftIcon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted z-10 pointer-events-none">
                        {leftIcon}
                    </div>
                )}

                <input
                    ref={inputRef}
                    type="text"
                    value={value || ""}
                    className={`
                        w-full bg-transparent
                        text-text placeholder:text-text-subtle
                        outline-none
                        h-[44px]
                        ${leftIcon ? "pl-10" : "pl-4"}
                        ${rightIcon ? "pr-10" : "pr-4"}
                        ${disabled ? "pointer-events-none" : ""}
                    `}
                    placeholder={placeholder}
                    disabled={disabled}
                    autoComplete="off"
                    onChange={(e) => onChange(e.target.value)}
                />

                {rightIcon && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted z-10 pointer-events-none">
                        {rightIcon}
                    </div>
                )}
            </div>
            {error && (
                <p className="mt-1.5 text-sm text-danger-500" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}
