import { Input, Checkbox, Select, Textarea } from "@/components/common";
import { UnitFormData } from "../types";
import { ListingType } from "@/types/db";
import { LEASE_MONTH_OPTIONS } from "../constants";

interface UnitFormProps {
    unit: UnitFormData;
    index: number;
    listingType: ListingType;
    onUpdate: (index: number, updates: Partial<UnitFormData>) => void;
}

export function UnitForm({ unit, index, listingType, onUpdate }: UnitFormProps) {
    // Calculate bond as 4 times weekly rent
    const calculatedBond = unit.price ? Math.round(parseFloat(unit.price) * 4).toString() : "0";

    const handlePriceChange = (value: string) => {
        const bond = value ? Math.round(parseFloat(value) * 4).toString() : "";
        onUpdate(index, { price: value, bond_amount: bond });
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
        <div className="space-y-4 rounded-md border border-border bg-surface-subtle/50 p-3 sm:p-4">
            {/* Row 1: Price per Week, Max Occupants, Area */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="relative">
                    <Input
                        label="Price per Week"
                        type="number"
                        value={unit.price}
                        onChange={(e) => handlePriceChange(e.target.value)}
                        placeholder="0"
                        min="0"
                        required
                    />
                    {unit.price && parseFloat(unit.price) > 0 && (
                        <div className="absolute right-2 bottom-[10px] flex items-center gap-1.5 rounded-full border border-primary-500/20 bg-primary-100 px-2.5 py-1 text-primary-700 dark:bg-primary-900/40 dark:text-primary-200 dark:border-primary-300/25">
                            <span className="text-[10px] font-medium uppercase tracking-wide text-primary-600 dark:text-primary-200">
                                Bond
                            </span>
                            <span className="text-xs font-semibold">${calculatedBond}</span>
                        </div>
                    )}
                </div>
                <div>
                    <Input
                        label="Max Occupants"
                        type="number"
                        value={unit.max_occupants}
                        onChange={(e) => onUpdate(index, { max_occupants: e.target.value })}
                        placeholder="0"
                        min="0"
                    />
                </div>
                <div>
                    <Input
                        label="Area (sqm)"
                        type="number"
                        value={unit.size_sqm}
                        onChange={(e) => onUpdate(index, { size_sqm: e.target.value })}
                        placeholder="0"
                        min="0"
                    />
                </div>
            </div>

            {/* Row 2: Min Lease, Max Lease, Available From, Available To */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                    <Select
                        label="Min Lease"
                        value={unit.min_lease}
                        onChange={(e) => handleMinLeaseChange(e.target.value)}
                        options={LEASE_MONTH_OPTIONS}
                    />
                </div>
                <div>
                    <Select
                        label="Max Lease"
                        value={unit.max_lease}
                        onChange={(e) => handleMaxLeaseChange(e.target.value)}
                        options={LEASE_MONTH_OPTIONS}
                    />
                </div>
                <div>
                    <Input
                        label="Available From"
                        type="date"
                        value={unit.available_from}
                        onChange={(e) => onUpdate(index, { available_from: e.target.value })}
                    />
                </div>
                <div>
                    <Input
                        label="Available To (Optional)"
                        type="date"
                        value={unit.available_to}
                        onChange={(e) => onUpdate(index, { available_to: e.target.value })}
                    />
                </div>
            </div>

            {/* Row 3: Bills Included, Currently Available */}
            <div className="grid grid-cols-2 gap-4">
                <div className="flex items-end pb-2">
                    <Checkbox
                        label="Bills Included"
                        checked={unit.bills_included}
                        onChange={(e) => onUpdate(index, { bills_included: e.target.checked })}
                    />
                </div>
                <div className="flex items-end pb-2">
                    <Checkbox
                        label="Currently Available"
                        checked={unit.is_available}
                        onChange={(e) => onUpdate(index, { is_available: e.target.checked })}
                    />
                </div>
            </div>

            {/* Row 4: Unit Description */}
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
