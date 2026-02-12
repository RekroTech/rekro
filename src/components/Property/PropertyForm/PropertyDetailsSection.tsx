import { Input, Checkbox } from "@/components/common";
import { PropertyFormData } from "../types";
import { AmenitiesSection } from "./AmenitiesSection";

interface PropertyDetailsSectionProps {
    formData: PropertyFormData;
    updateFormData: (updates: Partial<PropertyFormData>) => void;
}

export function PropertyDetailsSection({ formData, updateFormData }: PropertyDetailsSectionProps) {
    return (
        <section className="rounded-lg border border-border bg-card/80 p-3 shadow-sm sm:p-4">
            <div className="mb-3 sm:mb-4">
                <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
                    Property Details
                </h4>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Input
                    label="Bedrooms"
                    type="number"
                    value={formData.bedrooms}
                    onChange={(e) => updateFormData({ bedrooms: e.target.value })}
                    placeholder="1"
                    min="1"
                />

                <Input
                    label="Bathrooms"
                    type="number"
                    value={formData.bathrooms}
                    onChange={(e) => updateFormData({ bathrooms: e.target.value })}
                    placeholder="1"
                    min="1"
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

            <div className="mt-4 flex items-center">
                <Checkbox
                    label="Furnished"
                    checked={formData.furnished}
                    onChange={(e) => updateFormData({ furnished: e.target.checked })}
                />
            </div>

            {/* Amenities */}
            <div className="mt-6">
                <AmenitiesSection formData={formData} updateFormData={updateFormData} />
            </div>
        </section>
    );
}
