"use client";

import type { Property } from "@/types/property.types";
import {
    FURNITURE_COST,
    CARPARK_COST_PER_WEEK,
    STORAGE_CAGE_COST_PER_WEEK,
} from "@/components/Property/constants";
import {
    getBillsCostPerWeek,
    getEntireHomeCleaningCosts,
    getRoomFurnitureCost,
    hasCarpark,
    hasStorage,
} from "@/components/Property/utils";
import { InclusionCard } from "./InclusionCard";
import { InclusionsData } from "@/components/Property/types";

interface InclusionsProps {
    property: Property;
    inclusions: InclusionsData;
    onChange: (next: InclusionsData) => void;
    isEntireHome: boolean;
    /** For room listings: changes cleaning label ($35 vs $60). */
    effectiveIsDualOccupancy: boolean;
}

export function Inclusions({
    property,
    inclusions,
    onChange,
    isEntireHome,
    effectiveIsDualOccupancy,
}: InclusionsProps) {
    const furnitureTotal = isEntireHome
        ? FURNITURE_COST
        : getRoomFurnitureCost(property.units || [], FURNITURE_COST);

    const furnitureWeekly = furnitureTotal / (inclusions.selectedLease * 4.33);

    return (
        <div className="space-y-2 sm:space-y-3">
            {!isEntireHome ? (
                <InclusionCard
                    title="Furnished"
                    description="Furniture is included in the rent for room listings."
                    price={<span className="font-medium text-green-700">Included</span>}
                    selected={true}
                    disabled
                    onToggle={() => {}}
                />
            ) : !property.furnished ? (
                <InclusionCard
                    title="Furnish your space"
                    description="Add furniture to your lease."
                    price={<span>+${furnitureWeekly.toFixed(2)}/week</span>}
                    selected={inclusions.furnitureSelected}
                    onToggle={() => {
                        const nextSelected = !inclusions.furnitureSelected;
                        onChange({
                            ...inclusions,
                            furnitureSelected: nextSelected,
                        });
                    }}
                />
            ) : null}

            {!isEntireHome ? (
                <InclusionCard
                    title="Bills included"
                    description="Electricity, gas, water, and internet are included in the rent."
                    price={<span className="font-medium text-green-700">Included</span>}
                    selected={true}
                    disabled
                    onToggle={() => {}}
                />
            ) : (
                <InclusionCard
                    title="Include Bills"
                    description="Electricity, gas, water, and internet bundled into your rent."
                    price={<span>+${getBillsCostPerWeek(property.bedrooms)}/week</span>}
                    selected={inclusions.billsIncluded}
                    onToggle={() =>
                        onChange({ ...inclusions, billsIncluded: !inclusions.billsIncluded })
                    }
                />
            )}

            <InclusionCard
                title="Regular cleaning service"
                description={
                    isEntireHome
                        ? "Monthly cleaning for the entire home."
                        : "Monthly cleaning for your room and shared areas."
                }
                price={
                    isEntireHome ? (
                        <span>
                            ${getEntireHomeCleaningCosts(property.units || []).regularWeekly}/week
                        </span>
                    ) : (
                        <span>${effectiveIsDualOccupancy ? 60 : 35}/week</span>
                    )
                }
                selected={inclusions.regularCleaningSelected}
                onToggle={() =>
                    onChange({
                        ...inclusions,
                        regularCleaningSelected: !inclusions.regularCleaningSelected,
                    })
                }
            />

            {!isEntireHome && hasCarpark(property.amenities) && (
                <InclusionCard
                    title="Carpark"
                    description="Reserved car space (subject to availability)."
                    price={<span>+${CARPARK_COST_PER_WEEK}/week</span>}
                    selected={inclusions.carparkSelected}
                    onToggle={() =>
                        onChange({
                            ...inclusions,
                            carparkSelected: !inclusions.carparkSelected,
                        })
                    }
                />
            )}

            {!isEntireHome && hasStorage(property.amenities) && (
                <InclusionCard
                    title="Storage cage"
                    description="Extra secure storage space for boxes and belongings."
                    price={<span>+${STORAGE_CAGE_COST_PER_WEEK}/week</span>}
                    selected={inclusions.storageCageSelected}
                    onToggle={() =>
                        onChange({
                            ...inclusions,
                            storageCageSelected: !inclusions.storageCageSelected,
                        })
                    }
                />
            )}
        </div>
    );
}
