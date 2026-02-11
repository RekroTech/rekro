import { Address, Input, Select, Textarea } from "@/components/common";
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
    const handleAddressSelect = (addressComponents: {
        street_number?: string;
        route?: string;
        locality?: string;
        administrative_area_level_1?: string;
        postal_code?: string;
        country?: string;
        coordinates?: { lat: number; lng: number };
    }) => {
        // Construct full street address
        const streetAddress = [addressComponents.street_number, addressComponents.route]
            .filter(Boolean)
            .join(" ");

        const city = addressComponents.locality || "";
        const state = addressComponents.administrative_area_level_1 || "";
        const postcode = addressComponents.postal_code || "";
        const country = addressComponents.country || "Australia";

        // Construct full formatted address for display
        const fullAddress = [streetAddress, city, state, postcode, country]
            .filter(Boolean)
            .join(", ");

        updateFormData({
            address_full: fullAddress,
            address_street: streetAddress || formData.address_street,
            address_city: city || formData.address_city,
            address_state: state || formData.address_state,
            address_postcode: postcode || formData.address_postcode,
            address_country: country || formData.address_country,
            latitude: addressComponents.coordinates?.lat,
            longitude: addressComponents.coordinates?.lng,
        });
    };

    return (
        <section className="rounded-lg border border-gray-200 bg-white/80 p-3 shadow-sm sm:p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                    <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                        Basic Information
                    </h4>
                </div>
            </div>

            <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input
                        label="Title"
                        type="text"
                        value={formData.title}
                        onChange={(e) => updateFormData({ title: e.target.value })}
                        placeholder="e.g., Modern 3-Bedroom House in Suburb"
                        required
                    />

                    <Select
                        label="Property Type"
                        value={formData.property_type}
                        onChange={(e) => updateFormData({ property_type: e.target.value })}
                        options={PROPERTY_TYPES}
                        required
                    />
                </div>

                <div className="space-y-4">
                    <Address
                        label="Address"
                        value={formData.address_full}
                        onChange={(value) => updateFormData({ address_full: value })}
                        onAddressSelect={handleAddressSelect}
                        placeholder="Start typing to search for an address..."
                    />
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
