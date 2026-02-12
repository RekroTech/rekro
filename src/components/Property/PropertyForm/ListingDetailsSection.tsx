import { Select, Input } from "@/components/common";
import { UnitFormData } from "../types";
import { UnitForm } from "./UnitForm";
import { LISTING_TYPES } from "../constants";
import { ListingTypeSelection } from "@/components/Property/hooks/usePropertyForm";

interface ListingDetailsSectionProps {
    listingType: ListingTypeSelection;
    units: UnitFormData[];
    activeRoomTab: number;
    bedrooms: string;
    price: string;
    onListingTypeChange: (type: ListingTypeSelection) => void;
    onActiveRoomTabChange: (index: number) => void;
    onUpdateUnit: (index: number, updates: Partial<UnitFormData>) => void;
    onPriceChange: (price: string) => void;
}

export function ListingDetailsSection({
    listingType,
    units,
    activeRoomTab,
    bedrooms,
    price,
    onListingTypeChange,
    onActiveRoomTabChange,
    onUpdateUnit,
    onPriceChange,
}: ListingDetailsSectionProps) {
    const bedroomCount = parseInt(bedrooms) || 1;
    const isListingTypeLocked = bedroomCount === 1;

    // When locked, the hook forces listingType to "entire_home".
    // We still defensively force the displayed value here to avoid UI mismatch.
    const displayedListingType: ListingTypeSelection = isListingTypeLocked
        ? "entire_home"
        : listingType;

    return (
        <section className="rounded-lg border border-border bg-card/80 p-3 shadow-sm sm:p-4">
            <div className="mb-3 sm:mb-4">
                <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
                    Listing Details
                </h4>
            </div>

            <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Select
                        label="Listing Type"
                        value={displayedListingType}
                        onChange={(e) =>
                            onListingTypeChange(e.target.value as ListingTypeSelection)
                        }
                        options={LISTING_TYPES}
                        required
                        disabled={isListingTypeLocked}
                    />

                    <Input
                        label="Base Rent (per week)"
                        type="number"
                        value={price}
                        onChange={(e) => onPriceChange(e.target.value)}
                        placeholder="0"
                        min="0"
                        required
                    />
                </div>

                {/* Tab Navigation for Rooms */}
                {!isListingTypeLocked &&
                    (displayedListingType === "room" || displayedListingType === "all") &&
                    units.length > 1 && (
                        <div className="border-b border-border">
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
                                                    : "border-transparent text-text-muted hover:border-border hover:text-foreground"
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
