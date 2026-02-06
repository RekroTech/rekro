import { Select } from "@/components/common";
import { UnitFormData } from "../types";
import { UnitForm } from "./UnitForm";
import { LISTING_TYPES } from "../constants";

interface ListingDetailsSectionProps {
    listingType: "entire_home" | "room";
    units: UnitFormData[];
    activeRoomTab: number;
    onListingTypeChange: (type: "entire_home" | "room") => void;
    onActiveRoomTabChange: (index: number) => void;
    onUpdateUnit: (index: number, updates: Partial<UnitFormData>) => void;
}

export function ListingDetailsSection({
    listingType,
    units,
    activeRoomTab,
    onListingTypeChange,
    onActiveRoomTabChange,
    onUpdateUnit,
}: ListingDetailsSectionProps) {
    return (
        <section className="rounded-lg border border-gray-200 bg-white/80 p-4 shadow-sm">
            <div className="mb-3">
                <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                    Listing Details
                </h4>
            </div>

            <div className="space-y-4">
                {/* Listing Type Selection */}
                <Select
                    label="Listing Type"
                    value={listingType}
                    onChange={(e) => onListingTypeChange(e.target.value as "entire_home" | "room")}
                    options={LISTING_TYPES}
                    required
                />

                {/* Tab Navigation for Rooms */}
                {listingType === "room" && units.length > 1 && (
                    <div className="border-b border-gray-200">
                        <div className="flex gap-1 overflow-x-auto">
                            {units.map((unit, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => onActiveRoomTabChange(index)}
                                    className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                                        activeRoomTab === index
                                            ? "border-primary-500 text-primary-600"
                                            : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                                    }`}
                                >
                                    {unit.name || `Room ${index + 1}`}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Dynamic Unit Forms */}
                {listingType === "room"
                    ? // Show only the active tab's form for room listings
                      units[activeRoomTab] && (
                          <UnitForm
                              unit={units[activeRoomTab]}
                              index={activeRoomTab}
                              listingType={listingType}
                              onUpdate={onUpdateUnit}
                          />
                      )
                    : // Show single form for entire home
                      units.map((unit, index) => (
                          <UnitForm
                              key={index}
                              unit={unit}
                              index={index}
                              listingType={listingType}
                              onUpdate={onUpdateUnit}
                          />
                      ))}
            </div>
        </section>
    );
}
