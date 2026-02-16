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
    isInclusionSelected,
    toggleInclusion,
} from "@/components/Property/utils";
import { InclusionCard } from "./InclusionCard";
import { Inclusion } from "@/components/Property/types";
import { OccupancyType } from "@/types/db";

interface InclusionsProps {
    property: Property;
    inclusions: Inclusion[];
    onChange: (next: Inclusion[]) => void;
    isEntireHome: boolean;
    /** For room listings: changes cleaning label ($35 vs $60). */
    effectiveOccupancyType: OccupancyType;
    /** Rental period in months */
    rentalDuration: number;
}

export function Inclusions({
    property,
    inclusions,
    onChange,
    isEntireHome,
    effectiveOccupancyType,
    rentalDuration,
}: InclusionsProps) {
    const furnitureTotal = isEntireHome
        ? FURNITURE_COST
        : getRoomFurnitureCost(property.units || [], FURNITURE_COST);

    const furnitureWeekly = furnitureTotal / (rentalDuration * 4.33);

    const furnitureSelected = isInclusionSelected(inclusions, "furniture");
    const billsSelected = isInclusionSelected(inclusions, "bills");
    const cleaningSelected = isInclusionSelected(inclusions, "cleaning");
    const carparkSelected = isInclusionSelected(inclusions, "carpark");
    const storageSelected = isInclusionSelected(inclusions, "storage");

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
                    selected={furnitureSelected}
                    onToggle={() => {
                        onChange(toggleInclusion(inclusions, "furniture"));
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
                    selected={billsSelected}
                    onToggle={() => onChange(toggleInclusion(inclusions, "bills"))}
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
                        <span>${effectiveOccupancyType === "dual" ? 60 : 35}/week</span>
                    )
                }
                selected={cleaningSelected}
                onToggle={() => onChange(toggleInclusion(inclusions, "cleaning"))}
            />

            {!isEntireHome && hasCarpark(property.amenities) && (
                <InclusionCard
                    title="Carpark"
                    description="Reserved car space (subject to availability)."
                    price={<span>+${CARPARK_COST_PER_WEEK}/week</span>}
                    selected={carparkSelected}
                    onToggle={() => onChange(toggleInclusion(inclusions, "carpark"))}
                />
            )}

            {!isEntireHome && hasStorage(property.amenities) && (
                <InclusionCard
                    title="Storage cage"
                    description="Extra secure storage space for boxes and belongings."
                    price={<span>+${STORAGE_CAGE_COST_PER_WEEK}/week</span>}
                    selected={storageSelected}
                    onToggle={() => onChange(toggleInclusion(inclusions, "storage"))}
                />
            )}
        </div>
    );
}
