import { Select } from "@/components/common";
import { UnitFormData } from "../types";
import { UnitForm } from "./UnitForm";
import { LISTING_TYPES } from "../constants";
import { ListingTypeSelection } from "@/components/Property/hooks/usePropertyForm";

interface ListingDetailsSectionProps {
    listingType: ListingTypeSelection;
    units: UnitFormData[];
    activeRoomTab: number;
    bedrooms: string;
    onListingTypeChange: (type: ListingTypeSelection) => void;
    onActiveRoomTabChange: (index: number) => void;
    onUpdateUnit: (index: number, updates: Partial<UnitFormData>) => void;
}

export function ListingDetailsSection({
    listingType,
    units,
    activeRoomTab,
    bedrooms,
    onListingTypeChange,
    onActiveRoomTabChange,
    onUpdateUnit,
}: ListingDetailsSectionProps) {
    const bedroomCount = parseInt(bedrooms) || 1;
    const isListingTypeLocked = bedroomCount === 1;

    // When locked, the hook forces listingType to "entire_home".
    // We still defensively force the displayed value here to avoid UI mismatch.
    const displayedListingType: ListingTypeSelection = isListingTypeLocked
        ? "entire_home"
        : listingType;

    return (
        <section className="rounded-lg border border-gray-200 bg-white/80 p-4 shadow-sm">
            <div className="mb-3">
                <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                    Listing Details
                </h4>
            </div>

            <div className="space-y-4">
                <Select
                    label="Listing Type"
                    value={displayedListingType}
                    onChange={(e) => onListingTypeChange(e.target.value as ListingTypeSelection)}
                    options={LISTING_TYPES}
                    required
                    disabled={isListingTypeLocked}
                />

                {/* Tab Navigation for Rooms */}
                {!isListingTypeLocked &&
                    (displayedListingType === "room" || displayedListingType === "all") &&
                    units.length > 1 && (
                        <div className="border-b border-gray-200">
                            <div className="flex gap-1 overflow-x-auto">
                                {units.map((unit, index) => {
                                    // Always use unit.name for the tab label to keep them in sync
                                    const label =
                                        unit.name ||
                                        (displayedListingType === "all" && index === 0
                                            ? "Entire Home"
                                            : `Room ${displayedListingType === "all" ? index : index + 1}`);

                                    return (
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
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                {/* Dynamic Unit Forms */}
                {!isListingTypeLocked &&
                (displayedListingType === "room" || displayedListingType === "all")
                    ? units[activeRoomTab] && (
                          <UnitForm
                              unit={units[activeRoomTab]}
                              index={activeRoomTab}
                              listingType={
                                  displayedListingType === "all" && activeRoomTab === 0
                                      ? "entire_home"
                                      : "room"
                              }
                              onUpdate={onUpdateUnit}
                          />
                      )
                    : units.map((unit, index) => (
                          <UnitForm
                              key={index}
                              unit={unit}
                              index={index}
                              listingType={"entire_home"}
                              onUpdate={onUpdateUnit}
                          />
                      ))}
            </div>
        </section>
    );
}
