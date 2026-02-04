import { Button } from "@/components/common";
import { Property, Unit } from "@/types/db";

interface PropertySidebarProps {
    selectedUnit: Unit | null;
    isEntireHome: boolean;
    isLiked: boolean;
    onToggleLike: () => void;
    isPending: boolean;
    property: Property;
}

export function PropertySidebar({
    selectedUnit,
    isEntireHome,
    isLiked,
    onToggleLike,
    isPending,
    property,
}: PropertySidebarProps) {
    return (
        <div className="col-span-1">
            <div className="bg-white border border-border rounded-lg p-6 shadow-lg sticky top-4">
                {selectedUnit && (
                    <div className="mb-4 pb-4 border-b border-border">
                        <h3 className="text-sm font-semibold text-text-muted mb-1">
                            {isEntireHome ? "Price" : "Room Price"}
                        </h3>
                        <p className="text-3xl font-bold text-primary-600">
                            ${selectedUnit.price_per_week}
                            <span className="text-base font-normal text-text-muted">/week</span>
                        </p>
                        {selectedUnit.bond_amount && (
                            <p className="text-sm text-text-muted mt-1">
                                Bond: ${selectedUnit.bond_amount}
                            </p>
                        )}
                    </div>
                )}

                <h3 className="text-xl font-bold text-text mb-4">Interested?</h3>
                <p className="text-text-muted mb-6">
                    Get in touch to schedule a viewing or request more information about this{" "}
                    {isEntireHome ? "property" : "room"}.
                </p>

                <div className="space-y-3">
                    <Button variant="primary" className="w-full">
                        <svg
                            className="w-5 h-5 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                        </svg>
                        Contact Landlord
                    </Button>

                    <Button variant="secondary" className="w-full">
                        <svg
                            className="w-5 h-5 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                        </svg>
                        Schedule Viewing
                    </Button>

                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={onToggleLike}
                        disabled={isPending}
                    >
                        <svg
                            className={`w-5 h-5 mr-2 ${isLiked ? "fill-red-500 stroke-red-500" : ""}`}
                            fill={isLiked ? "currentColor" : "none"}
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                        </svg>
                        {isLiked ? "Saved" : "Save"} {isEntireHome ? "Property" : "Room"}
                    </Button>
                </div>

                {/* Details */}
                <div className="mt-6 pt-6 border-t border-border">
                    <h4 className="text-sm font-semibold text-text mb-3">
                        {isEntireHome ? "Property" : "Room"} Details
                    </h4>

                    <div className="space-y-2 text-sm">
                        {selectedUnit && (
                            <>
                                {selectedUnit.max_occupants && (
                                    <div className="flex justify-between">
                                        <span className="text-text-muted">Max Occupants:</span>
                                        <span className="text-text font-medium">
                                            {selectedUnit.max_occupants}
                                        </span>
                                    </div>
                                )}

                                {selectedUnit.size_sqm && (
                                    <div className="flex justify-between">
                                        <span className="text-text-muted">Size:</span>
                                        <span className="text-text font-medium">
                                            {selectedUnit.size_sqm} sqm
                                        </span>
                                    </div>
                                )}

                                {selectedUnit.bills_included !== null && (
                                    <div className="flex justify-between">
                                        <span className="text-text-muted">Bills Included:</span>
                                        <span className="text-text font-medium">
                                            {selectedUnit.bills_included ? "Yes" : "No"}
                                        </span>
                                    </div>
                                )}

                                {(selectedUnit.min_lease_weeks || selectedUnit.max_lease_weeks) && (
                                    <div className="flex justify-between">
                                        <span className="text-text-muted">Lease Term:</span>
                                        <span className="text-text font-medium">
                                            {selectedUnit.min_lease_weeks &&
                                                `${selectedUnit.min_lease_weeks}w`}
                                            {selectedUnit.min_lease_weeks &&
                                                selectedUnit.max_lease_weeks &&
                                                " - "}
                                            {selectedUnit.max_lease_weeks &&
                                                `${selectedUnit.max_lease_weeks}w`}
                                        </span>
                                    </div>
                                )}
                            </>
                        )}

                        {property.property_type && (
                            <div className="flex justify-between">
                                <span className="text-text-muted">Property Type:</span>
                                <span className="text-text font-medium capitalize">
                                    {property.property_type}
                                </span>
                            </div>
                        )}

                        {property.furnished !== undefined && (
                            <div className="flex justify-between">
                                <span className="text-text-muted">Furnished:</span>
                                <span className="text-text font-medium">
                                    {property.furnished ? "Yes" : "No"}
                                </span>
                            </div>
                        )}

                        {property.created_at && (
                            <div className="flex justify-between">
                                <span className="text-text-muted">Listed:</span>
                                <span className="text-text font-medium">
                                    {new Date(property.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
