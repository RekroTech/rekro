import { Input, Checkbox, Select } from "@/components/common";
import { PropertyFormData } from "./types";
import { PROPERTY_TYPES } from "./constants";

interface BasicInformationSectionProps {
    formData: PropertyFormData;
    updateFormData: (updates: Partial<PropertyFormData>) => void;
}

export function BasicInformationSection({
    formData,
    updateFormData,
}: BasicInformationSectionProps) {
    return (
        <section className="rounded-lg border border-gray-200 bg-white/80 p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                    <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                        Basic Information
                    </h4>
                </div>
            </div>

            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Property Title"
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

                <div className="flex items-center">
                    <Checkbox
                        label="Furnished"
                        checked={formData.furnished}
                        onChange={(e) => updateFormData({ furnished: e.target.checked })}
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        Description
                    </label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => updateFormData({ description: e.target.value })}
                        placeholder="Describe the property, key features and nearby amenities..."
                        rows={4}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/80"
                    />
                    <p className="mt-1 text-xs text-gray-400">
                        Highlight what makes this property unique.
                    </p>
                </div>
            </div>
        </section>
    );
}
