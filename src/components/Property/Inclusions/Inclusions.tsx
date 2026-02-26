"use client";

import type { OccupancyType } from "@/types/db";
import type { Property,  Inclusions as InclusionsType } from "@/types/property.types";
import { hasCarpark, hasStorage } from "@/components/Property";
import {
    CARPARK_COST_PER_WEEK,
    FURNITURE_COST,
    STORAGE_CAGE_COST_PER_WEEK,
} from "@/lib/config/pricing_config";
import {
    getBillsCostPerWeek,
    getEntireHomeCleaningCosts,
    getRoomFurnitureCost,
} from "@/components/Property/utils/pricing";
import { toggleInclusionWithPrice } from "@/components/Property/utils/inclusions";
import { InclusionCard } from "./InclusionCard";

interface InclusionsProps {
    property: Property;
    inclusions: InclusionsType;
    onChange: (next: InclusionsType) => void;
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
                    selected={inclusions.furniture?.selected || false}
                    onToggle={() => {
                        onChange(
                            toggleInclusionWithPrice({
                                inclusions,
                                type: "furniture",
                                property,
                                isEntireHome,
                                effectiveOccupancyType,
                                rentalDurationMonths: rentalDuration,
                            })
                        );
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
                    selected={inclusions.bills?.selected || false}
                    onToggle={() =>
                        onChange(
                            toggleInclusionWithPrice({
                                inclusions,
                                type: "bills",
                                property,
                                isEntireHome,
                                effectiveOccupancyType,
                                rentalDurationMonths: rentalDuration,
                            })
                        )
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
                        <span>${effectiveOccupancyType === "dual" ? 60 : 35}/week</span>
                    )
                }
                selected={inclusions.cleaning?.selected || false}
                onToggle={() =>
                    onChange(
                        toggleInclusionWithPrice({
                            inclusions,
                            type: "cleaning",
                            property,
                            isEntireHome,
                            effectiveOccupancyType,
                            rentalDurationMonths: rentalDuration,
                        })
                    )
                }
            />

            {!isEntireHome && hasCarpark(property.amenities) && (
                <InclusionCard
                    title="Carpark"
                    description="Reserved car space (subject to availability)."
                    price={<span>+${CARPARK_COST_PER_WEEK}/week</span>}
                    selected={inclusions.carpark?.selected || false}
                    onToggle={() =>
                        onChange(
                            toggleInclusionWithPrice({
                                inclusions,
                                type: "carpark",
                                property,
                                isEntireHome,
                                effectiveOccupancyType,
                                rentalDurationMonths: rentalDuration,
                            })
                        )
                    }
                />
            )}

            {!isEntireHome && hasStorage(property.amenities) && (
                <InclusionCard
                    title="Storage cage"
                    description="Extra secure storage space for boxes and belongings."
                    price={<span>+${STORAGE_CAGE_COST_PER_WEEK}/week</span>}
                    selected={inclusions.storage?.selected || false}
                    onToggle={() =>
                        onChange(
                            toggleInclusionWithPrice({
                                inclusions,
                                type: "storage",
                                property,
                                isEntireHome,
                                effectiveOccupancyType,
                                rentalDurationMonths: rentalDuration,
                            })
                        )
                    }
                />
            )}
        </div>
    );
}
