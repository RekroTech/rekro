import { Unit } from "@/types/db";
import { useUnitAvailability } from "@/lib/react-query/hooks/useUnits";
import { Icon } from "@/components/common";

interface UnitsSelectorProps {
    units: Unit[];
    selectedUnitId: string | null;
    onUnitSelect: (id: string) => void;
}

function UnitAvailabilityBadge({ unitId }: { unitId: string }) {
    const { data: availability } = useUnitAvailability(unitId);

    if (!availability) return null;

    const now = new Date();
    const availableFrom = availability.available_from
        ? new Date(availability.available_from)
        : null;

    let badgeColor: string;
    let badgeText: string;

    if (!availability.is_available) {
        badgeColor = "bg-red-100 text-red-700";
        badgeText = "Unavailable";
    } else if (availableFrom && availableFrom > now) {
        badgeColor = "bg-yellow-100 text-yellow-700";
        badgeText = `From ${availableFrom.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    } else {
        badgeColor = "bg-green-100 text-green-700";
        badgeText = "Available";
    }

    return (
        <span className={`text-xs px-2 py-1 rounded-full ${badgeColor} font-medium`}>
            {badgeText}
        </span>
    );
}

export function UnitsSelector({ units, selectedUnitId, onUnitSelect }: UnitsSelectorProps) {
    if (units.length === 0) return null;

    return (
        <div className="my-6">
            <h2 className="text-xl font-bold text-text mb-3">Available Rooms ({units.length})</h2>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {units.map((unit: Unit, idx: number) => {
                    const isSelected = selectedUnitId === unit.id;

                    return (
                        <button
                            key={unit.id}
                            onClick={() => onUnitSelect(unit.id)}
                            className={`text-left p-4 rounded-lg border-2 transition-all ${
                                isSelected
                                    ? "border-primary-500 bg-primary-50 shadow-md"
                                    : "border-gray-200 bg-white hover:border-gray-300 hover:shadow"
                            }`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-semibold text-text">
                                        {unit.name || `Room ${idx + 1}`}
                                    </h3>
                                    <p className="text-sm text-text-muted">Private Room</p>
                                </div>
                                <div className="text-right flex flex-col items-end gap-1">
                                    <UnitAvailabilityBadge unitId={unit.id} />
                                    <p className="text-lg font-bold text-primary-600">
                                        ${unit.price_per_week}
                                        <span className="text-sm font-normal text-text-muted">
                                            /week
                                        </span>
                                    </p>
                                </div>
                            </div>

                            {unit.description && (
                                <p className="text-sm text-text-muted line-clamp-2 mb-2">
                                    {unit.description}
                                </p>
                            )}

                            <div className="flex flex-wrap gap-2 text-xs text-text-muted">
                                {unit.max_occupants && (
                                    <span className="flex items-center gap-1">
                                        <Icon name="users" className="w-4 h-4" />
                                        Max {unit.max_occupants}{" "}
                                        {unit.max_occupants === 1 ? "person" : "people"}
                                    </span>
                                )}
                                {unit.size_sqm && <span>• {unit.size_sqm} sqm</span>}
                                {unit.bills_included && <span>• Bills included</span>}
                            </div>

                            {unit.bond_amount && (
                                <p className="text-xs text-text-muted mt-2">
                                    Bond: ${unit.bond_amount}
                                </p>
                            )}

                            {(unit.min_lease_weeks || unit.max_lease_weeks) && (
                                <p className="text-xs text-text-muted mt-1">
                                    Lease:{" "}
                                    {unit.min_lease_weeks && `${unit.min_lease_weeks} weeks min`}
                                    {unit.min_lease_weeks && unit.max_lease_weeks && " - "}
                                    {unit.max_lease_weeks && `${unit.max_lease_weeks} weeks max`}
                                </p>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
