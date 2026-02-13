import { Unit } from "@/types/db";
import { Icon } from "@/components/common";

interface UnitsSelectorProps {
    units: Unit[];
    selectedUnitId: string | null;
    onUnitSelect: (id: string) => void;
    // Optional dynamic pricing map - if provided, overrides unit.price
    dynamicPricing?: Record<string, number>;
}

function getUnitTypeLabel(unit: Unit) {
    switch (unit.listing_type) {
        case "entire_home":
            return "Entire Home";
        case "room":
            return "Room";
        default:
            return "Unit";
    }
}

function getUnitName(unit: Unit, idx: number) {
    const fallback = `${getUnitTypeLabel(unit)} ${idx + 1}`;
    return unit.name || fallback;
}

export function UnitsSelector({
    units,
    selectedUnitId,
    onUnitSelect,
    dynamicPricing,
}: UnitsSelectorProps) {
    if (units.length === 0) return null;

    return (
        <div className="my-4 sm:my-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                {units.map((unit: Unit, idx: number) => {
                    const isSelected = selectedUnitId === unit.id;
                    // Use dynamic pricing if available, otherwise fallback to unit.price
                    const displayPrice = dynamicPricing?.[unit.id] ?? unit.price;

                    return (
                        <button
                            key={unit.id}
                            onClick={() => onUnitSelect(unit.id)}
                            className={`relative text-left p-3 sm:p-4 rounded-lg border-2 transition-all ${
                                isSelected
                                    ? "border-primary-500 bg-primary-500/10 shadow-md"
                                    : "border-border bg-card hover:border-text-muted hover:shadow-sm"
                            }`}
                        >
                            {/* Availability Badge - Top Right */}
                            <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                                {isSelected ? (
                                    <div className="bg-primary-600 text-white rounded-full p-0.5">
                                        <Icon name="check" className="w-3.5 h-3.5" />
                                    </div>
                                ) : (
                                    <span
                                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                                            unit.is_available
                                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                        }`}
                                    >
                                        {unit.is_available ? "Available" : "Unavailable"}
                                    </span>
                                )}
                            </div>

                            {/* Unit Name */}
                            <h3 className="font-bold text-base text-text">
                                {getUnitName(unit, idx)}
                            </h3>

                            {/* Price */}
                            <div className="mb-2">
                                <div className="text-2xl font-bold text-primary-600">
                                    ${displayPrice.toFixed(0)}{" "}
                                    <span className="text-xs font-normal text-text-muted">p/w</span>
                                </div>
                            </div>

                            {/* Description */}
                            {unit.description && (
                                <p className="text-xs text-text-muted mb-2 line-clamp-2">
                                    {unit.description}
                                </p>
                            )}

                            {/* Details */}
                            <div className="text-xs text-text-muted flex flex-col sm:flex-row gap-2 items-left sm:items-center justify-between">
                                {unit.bond_amount && (
                                    <div className="flex items-center gap-1">
                                        <Icon name="document" className="w-3.5 h-3.5" />$
                                        {unit.bond_amount} bond
                                    </div>
                                )}
                                {unit.max_occupants && (
                                    <div className="flex items-center gap-1.5">
                                        <Icon name="users" className="w-3.5 h-3.5" />
                                        {unit.max_occupants}{" "}
                                        {unit.max_occupants === 1 ? "person" : "people"}
                                    </div>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
