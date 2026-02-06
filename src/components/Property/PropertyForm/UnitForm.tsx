import { Input, Checkbox } from "@/components/common";
import { UnitFormData } from "../types";

interface UnitFormProps {
    unit: UnitFormData;
    index: number;
    listingType: "entire_home" | "room";
    onUpdate: (index: number, updates: Partial<UnitFormData>) => void;
}

export function UnitForm({ unit, index, listingType, onUpdate }: UnitFormProps) {
    return (
        <div className="space-y-4 rounded-md border border-gray-200 bg-gray-50/50 p-4">
            <div className="grid grid-cols-2 gap-4">
                <Input
                    label={listingType === "room" ? "Room Name" : "Unit/Room Name (Optional)"}
                    type="text"
                    value={unit.name}
                    onChange={(e) => onUpdate(index, { name: e.target.value })}
                    placeholder={
                        listingType === "room"
                            ? `Room ${index + 1}`
                            : "e.g., Master Bedroom, Unit 1A"
                    }
                />

                <Input
                    label="Price per Week"
                    type="number"
                    value={unit.price_per_week}
                    onChange={(e) => onUpdate(index, { price_per_week: e.target.value })}
                    placeholder="0"
                    min="0"
                    required
                />
            </div>

            <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                    Unit Description (Optional)
                </label>
                <textarea
                    value={unit.unit_description}
                    onChange={(e) => onUpdate(index, { unit_description: e.target.value })}
                    placeholder={
                        listingType === "room"
                            ? "Additional details about this specific room..."
                            : "Additional details about this specific listing..."
                    }
                    rows={2}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/80"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Input
                    label="Bond Amount"
                    type="number"
                    value={unit.bond_amount}
                    onChange={(e) => onUpdate(index, { bond_amount: e.target.value })}
                    placeholder="0"
                    min="0"
                />

                <Input
                    label="Max Occupants"
                    type="number"
                    value={unit.max_occupants}
                    onChange={(e) => onUpdate(index, { max_occupants: e.target.value })}
                    placeholder="0"
                    min="0"
                />
            </div>

            <div className="grid grid-cols-3 gap-4">
                <Input
                    label="Min Lease (weeks)"
                    type="number"
                    value={unit.min_lease_weeks}
                    onChange={(e) => onUpdate(index, { min_lease_weeks: e.target.value })}
                    placeholder="0"
                    min="0"
                />

                <Input
                    label="Max Lease (weeks)"
                    type="number"
                    value={unit.max_lease_weeks}
                    onChange={(e) => onUpdate(index, { max_lease_weeks: e.target.value })}
                    placeholder="0"
                    min="0"
                />

                <Input
                    label="Size (sqm)"
                    type="number"
                    value={unit.size_sqm}
                    onChange={(e) => onUpdate(index, { size_sqm: e.target.value })}
                    placeholder="0"
                    min="0"
                    step="0.1"
                />
            </div>

            <div className="flex items-center">
                <Checkbox
                    label="Bills Included"
                    checked={unit.bills_included}
                    onChange={(e) => onUpdate(index, { bills_included: e.target.checked })}
                />
            </div>

            {/* Availability Section */}
            <div className="space-y-4 border-t border-gray-200 pt-4">
                <h5 className="text-sm font-medium text-gray-700">Availability</h5>

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Available From"
                        type="date"
                        value={unit.available_from}
                        onChange={(e) => onUpdate(index, { available_from: e.target.value })}
                    />

                    <Input
                        label="Available To (Optional)"
                        type="date"
                        value={unit.available_to}
                        onChange={(e) => onUpdate(index, { available_to: e.target.value })}
                    />
                </div>

                <div className="flex items-center">
                    <Checkbox
                        label="Currently Available"
                        checked={unit.is_available}
                        onChange={(e) => onUpdate(index, { is_available: e.target.checked })}
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        Availability Notes (Optional)
                    </label>
                    <textarea
                        value={unit.availability_notes}
                        onChange={(e) => onUpdate(index, { availability_notes: e.target.value })}
                        placeholder="Any special conditions or notes about availability..."
                        rows={2}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/80"
                    />
                </div>
            </div>
        </div>
    );
}
