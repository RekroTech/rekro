import { Unit } from "@/types/db";

interface UnitsSelectorProps {
    units: Unit[];
    selectedUnitId: string | null;
    onUnitSelect: (id: string) => void;
}

export function UnitsSelector({ units, selectedUnitId, onUnitSelect }: UnitsSelectorProps) {
    if (units.length === 0) return null;

    return (
        <div className="mb-6">
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
                                <div className="text-right">
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
                                        <svg
                                            className="w-4 h-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                            />
                                        </svg>
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
