import React from "react";
import { Input } from "@/components/common";
import { PropertyFormData } from "./types";
import { AmenitiesSection } from "./AmenitiesSection";

interface PropertyDetailsSectionProps {
    formData: PropertyFormData;
    updateFormData: (updates: Partial<PropertyFormData>) => void;
    listingType: "entire_home" | "room";
}

export function PropertyDetailsSection({
    formData,
    updateFormData,
    listingType,
}: PropertyDetailsSectionProps) {
    return (
        <section className="rounded-lg border border-gray-200 bg-white/80 p-4 shadow-sm">
            <div className="mb-3">
                <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                    Property Details
                </h4>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <Input
                    label="Bedrooms"
                    type="number"
                    value={formData.bedrooms}
                    onChange={(e) => updateFormData({ bedrooms: e.target.value })}
                    placeholder="0"
                    min={listingType === "room" ? "1" : "0"}
                />

                <Input
                    label="Bathrooms"
                    type="number"
                    value={formData.bathrooms}
                    onChange={(e) => updateFormData({ bathrooms: e.target.value })}
                    placeholder="0"
                    min="0"
                />

                <Input
                    label="Car Spaces"
                    type="number"
                    value={formData.car_spaces}
                    onChange={(e) => updateFormData({ car_spaces: e.target.value })}
                    placeholder="0"
                    min="0"
                />
            </div>

            {/* Amenities */}
            <div className="mt-6">
                <AmenitiesSection formData={formData} updateFormData={updateFormData} />
            </div>
        </section>
    );
}
