"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { clsx } from "clsx";
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

    // Store callbacks in refs so the autocomplete effect doesn't depend on them.
    // This prevents the autocomplete from being destroyed and recreated on every render,
    // which was the root cause of address/location/lat/lng being sent as null.
    const onChangeRef = useRef(onChange);
    const onAddressSelectRef = useRef(onAddressSelect);
    useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
    useEffect(() => { onAddressSelectRef.current = onAddressSelect; }, [onAddressSelect]);

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

    // Initialise Google Maps Autocomplete exactly ONCE (when the script has loaded).
    // Callbacks are read from refs so re-renders never tear down/recreate the widget.
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

        // Prevent double-init if the effect somehow re-runs with the same input
        if (autocompleteRef.current) return;

        const input = inputRef.current;

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
                onChangeRef.current(place.formatted_address);
            }

            onAddressSelectRef.current(parsePlace(place));
        });

        return () => {
            if (listener) listener.remove();
            google.maps.event.clearInstanceListeners(autocomplete);
            autocompleteRef.current = null;
        };
    }, [isScriptLoaded, parsePlace]);

    return (
        <div className="w-full">
            <div className="relative">
                {label && (
                    <label className="absolute left-3 px-1.5 bg-card text-xs font-medium text-text-subtle z-10 -translate-y-1/2">
                        {label}
                    </label>
                )}
                <div
                    className={clsx(
                        "relative w-full bg-card border border-border rounded-lg transition-all overflow-hidden",
                        error
                            ? "border-danger-500 focus-within:border-danger-600 hover:border-danger-400 focus-within:ring-2 focus-within:ring-danger-500"
                            : "focus-within:border-transparent hover:border-text-muted focus-within:ring-2 focus-within:ring-primary-500",
                        disabled && "opacity-50 cursor-not-allowed"
                    )}
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
                        className={clsx(
                            "w-full bg-transparent text-foreground placeholder:text-text-subtle outline-none py-2.5",
                            leftIcon ? "pl-10" : "pl-4",
                            rightIcon ? "pr-10" : "pr-4",
                            disabled && "pointer-events-none"
                        )}
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
            </div>
            {error && (
                <p className="mt-1.5 text-sm text-danger-500" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}
