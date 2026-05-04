import { useCallback } from "react";
import { Address, Select, Textarea } from "@/components/common";
import { PropertyFormData } from "../types";
import { PROPERTY_TYPES } from "../constants";

interface BasicInformationSectionProps {
    formData: PropertyFormData;
    updateFormData: (updates: Partial<PropertyFormData>) => void;
}

export function BasicInformationSection({
    formData,
    updateFormData,
}: BasicInformationSectionProps) {
    const handleAddressSelect = useCallback(
        (addressComponents: {
            formatted_address?: string;
            subpremise?: string;
            premise?: string;
            floor?: string;
            street_number?: string;
            route?: string;
            locality?: string;
            administrative_area_level_1?: string;
            postal_code?: string;
            country?: string;
            coordinates?: { lat: number; lng: number };
        }) => {
            const formattedAddress = addressComponents.formatted_address?.trim() || "";

            const streetFromFormattedAddress = formattedAddress.split(",")[0]?.trim() || "";
            const streetNumberAndRoute = [addressComponents.street_number, addressComponents.route]
                .filter(Boolean)
                .join(" ");
            const unitAndStreet = addressComponents.subpremise
                ? [addressComponents.subpremise, streetNumberAndRoute].filter(Boolean).join("/")
                : streetNumberAndRoute;
            const fallbackStreetAddress = [
                addressComponents.floor,
                addressComponents.premise,
                unitAndStreet,
            ]
                .filter(Boolean)
                .join(", ");
            const streetAddress = streetFromFormattedAddress || fallbackStreetAddress;

            const city = addressComponents.locality || "";
            const state = addressComponents.administrative_area_level_1 || "";
            const postcode = addressComponents.postal_code || "";
            const country = addressComponents.country || "Australia";

            const fullAddress =
                formattedAddress ||
                [streetAddress, city, state, postcode, country].filter(Boolean).join(", ");

            updateFormData({
                address_full: fullAddress,
                address_street: streetAddress,
                address_city: city,
                address_state: state,
                address_postcode: postcode,
                address_country: country,
                latitude: addressComponents.coordinates?.lat,
                longitude: addressComponents.coordinates?.lng,
            });
        },
        [updateFormData]
    );

    const handleAddressChange = useCallback(
        (value: string) => updateFormData({ address_full: value }),
        [updateFormData]
    );

    return (
        <section className="rounded-lg border border-border bg-card/80 p-3 shadow-sm sm:p-4">
            <div className="mb-3 sm:mb-4">
                <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
                        Basic Information
                    </h4>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                    <div className="flex-1">
                        <Address
                            label="Address"
                            value={formData.address_full}
                            onChange={handleAddressChange}
                            onAddressSelect={handleAddressSelect}
                            placeholder="Start typing to search for an address..."
                        />
                    </div>
                    <div className="shrink-0">
                        <Select
                            label="Property Type"
                            value={formData.property_type}
                            onChange={(e) => updateFormData({ property_type: e.target.value })}
                            options={PROPERTY_TYPES}
                            required
                        />
                    </div>
                </div>
                <Textarea
                    label="Description"
                    value={formData.description}
                    onChange={(e) => updateFormData({ description: e.target.value })}
                    placeholder="Describe the property, key features and nearby amenities..."
                    rows={4}
                />
            </div>
        </section>
    );
}
