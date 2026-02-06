import { Input } from "@/components/common";
import { PropertyFormData } from "./types";

interface AddressSectionProps {
    formData: PropertyFormData;
    updateFormData: (updates: Partial<PropertyFormData>) => void;
}

export function AddressSection({ formData, updateFormData }: AddressSectionProps) {
    return (
        <section className="rounded-lg border border-gray-200 bg-white/80 p-4 shadow-sm">
            <div className="mb-3">
                <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                    Address
                </h4>
            </div>

            <div className="space-y-4">
                <Input
                    label="Street Address"
                    type="text"
                    value={formData.address_street}
                    onChange={(e) => updateFormData({ address_street: e.target.value })}
                    placeholder="e.g., 123 Main Street"
                />

                <div className="grid grid-cols-3 gap-4">
                    <Input
                        label="City/Suburb"
                        type="text"
                        value={formData.address_city}
                        onChange={(e) => updateFormData({ address_city: e.target.value })}
                        placeholder="e.g., Sydney"
                    />

                    <Input
                        label="State"
                        type="text"
                        value={formData.address_state}
                        onChange={(e) => updateFormData({ address_state: e.target.value })}
                        placeholder="e.g., NSW"
                    />

                    <Input
                        label="Postcode"
                        type="text"
                        value={formData.address_postcode}
                        onChange={(e) => updateFormData({ address_postcode: e.target.value })}
                        placeholder="e.g., 2000"
                    />
                </div>
            </div>
        </section>
    );
}
