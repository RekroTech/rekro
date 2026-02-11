import { Input, Checkbox, Select, Textarea } from "@/components/common";
import { UnitFormData } from "../types";
import { ListingType } from "@/types/db";

interface UnitFormProps {
    unit: UnitFormData;
    index: number;
    listingType: ListingType;
    onUpdate: (index: number, updates: Partial<UnitFormData>) => void;
}

const LEASE_MONTH_OPTIONS = [
    { value: "4", label: "4 months" },
    { value: "6", label: "6 months" },
    { value: "9", label: "9 months" },
    { value: "12", label: "12 months" },
];

export function UnitForm({ unit, index, listingType, onUpdate }: UnitFormProps) {
    // Calculate bond as 4 times weekly rent
    const calculatedBond = unit.price_per_week
        ? (parseFloat(unit.price_per_week) * 4).toFixed(2)
        : "0";

    const handlePriceChange = (value: string) => {
        const bond = value ? (parseFloat(value) * 4).toString() : "";
        onUpdate(index, { price_per_week: value, bond_amount: bond });
    };

    const handleMinLeaseChange = (value: string) => {
        const minMonths = parseInt(value);
        const maxMonths = parseInt(unit.max_lease);

        // If min becomes greater than max, adjust max to match min
        if (maxMonths < minMonths) {
            onUpdate(index, { min_lease: value, max_lease: value });
        } else {
            onUpdate(index, { min_lease: value });
        }
    };

    const handleMaxLeaseChange = (value: string) => {
        const maxMonths = parseInt(value);
        const minMonths = parseInt(unit.min_lease);

        // If max becomes less than min, adjust min to match max
        if (maxMonths < minMonths) {
            onUpdate(index, { max_lease: value, min_lease: value });
        } else {
            onUpdate(index, { max_lease: value });
        }
    };

    return (
        <div className="space-y-4 rounded-md border border-gray-200 bg-gray-50/50 p-3 sm:p-4">
            {/* Main Details - Responsive layout */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:flex lg:gap-4">
                <div className="relative flex-1 min-w-0 sm:col-span-2">
                    <Input
                        label="Price per Week"
                        type="number"
                        value={unit.price_per_week}
                        onChange={(e) => handlePriceChange(e.target.value)}
                        placeholder="0"
                        min="0"
                        required
                    />
                    {unit.price_per_week && parseFloat(unit.price_per_week) > 0 && (
                        <div className="absolute right-2 bottom-[10px] flex items-center gap-1.5 rounded-full bg-primary-100 px-2.5 py-1">
                            <span className="text-[10px] font-medium uppercase tracking-wide text-primary-600">
                                Bond
                            </span>
                            <span className="text-xs font-semibold text-primary-700">
                                ${calculatedBond}
                            </span>
                        </div>
                    )}
                </div>
                <div className="lg:w-32">
                    <Input
                        label="Max Occupants"
                        type="number"
                        value={unit.max_occupants}
                        onChange={(e) => onUpdate(index, { max_occupants: e.target.value })}
                        placeholder="0"
                        min="0"
                    />
                </div>
                <div className="lg:w-36">
                    <Select
                        label="Min Lease"
                        value={unit.min_lease}
                        onChange={(e) => handleMinLeaseChange(e.target.value)}
                        options={LEASE_MONTH_OPTIONS}
                    />
                </div>
                <div className="lg:w-36">
                    <Select
                        label="Max Lease"
                        value={unit.max_lease}
                        onChange={(e) => handleMaxLeaseChange(e.target.value)}
                        options={LEASE_MONTH_OPTIONS}
                    />
                </div>
            </div>

            {/* Availability Section */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="flex items-end sm:pb-2">
                    <Checkbox
                        label="Currently Available"
                        checked={unit.is_available}
                        onChange={(e) => onUpdate(index, { is_available: e.target.checked })}
                    />
                </div>
                <div className="flex-1">
                    <Input
                        label="Available From"
                        type="date"
                        value={unit.available_from}
                        onChange={(e) => onUpdate(index, { available_from: e.target.value })}
                    />
                </div>
                <div className="flex-1">
                    <Input
                        label="Available To (Optional)"
                        type="date"
                        value={unit.available_to}
                        onChange={(e) => onUpdate(index, { available_to: e.target.value })}
                    />
                </div>
            </div>

            {/* Additional Details */}
            <div className="grid grid-cols-2 gap-4">
                <div className="flex items-end pb-2">
                    <Checkbox
                        label="Bills Included"
                        checked={unit.bills_included}
                        onChange={(e) => onUpdate(index, { bills_included: e.target.checked })}
                    />
                </div>
            </div>

            {/* Optional Details */}
            <div>
                <Textarea
                    label="Unit Description"
                    value={unit.unit_description}
                    onChange={(e) => onUpdate(index, { unit_description: e.target.value })}
                    placeholder={
                        listingType === "room"
                            ? "Additional details about this specific room..."
                            : "Additional details about this specific listing..."
                    }
                    rows={2}
                />
            </div>
        </div>
    );
}
