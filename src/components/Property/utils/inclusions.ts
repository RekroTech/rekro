import { Inclusion, Inclusions, InclusionType, type Property } from "@/types/property.types";
import {
    CARPARK_COST_PER_WEEK,
    FURNITURE_COST,
    STORAGE_CAGE_COST_PER_WEEK,
} from "@/lib/config/pricing_config";
import { getBillsCostPerWeek, getEntireHomeCleaningCosts } from "../utils/pricing";

export const getInclusionByType = (
    inclusions: Inclusions,
    type: InclusionType
): Inclusion | undefined => {
    return inclusions[type];
};

export const isInclusionSelected = (inclusions: Inclusions, type: InclusionType): boolean => {
    return inclusions[type]?.selected ?? false;
};

export const updateInclusion = (
    inclusions: Inclusions,
    type: InclusionType,
    updates: Partial<Inclusion>
): Inclusions => {
    return {
        ...inclusions,
        [type]: { ...inclusions[type], ...updates } as Inclusion,
    };
};

export function getInclusionPricePerWeek(params: {
    type: InclusionType;
    property: Property;
    isEntireHome: boolean;
    effectiveOccupancyType: "single" | "dual";
    rentalDurationMonths: number;
}): number {
    const { type, property, isEntireHome, effectiveOccupancyType, rentalDurationMonths } = params;

    switch (type) {
        case "furniture": {
            // For room listings, furniture is included (not a paid add-on)
            if (!isEntireHome) return 0;
            const months =
                rentalDurationMonths && rentalDurationMonths > 0 ? rentalDurationMonths : 12;
            const weekly = FURNITURE_COST / (months * 4.33);
            return Number.isFinite(weekly) ? weekly : 0;
        }
        case "bills": {
            // For room listings, bills are included (not a paid add-on)
            if (!isEntireHome) return 0;
            return getBillsCostPerWeek(property.bedrooms);
        }
        case "cleaning": {
            if (isEntireHome) {
                return getEntireHomeCleaningCosts(property.units || []).regularWeekly;
            }
            return effectiveOccupancyType === "dual" ? 60 : 35;
        }
        case "carpark":
            return isEntireHome ? 0 : CARPARK_COST_PER_WEEK;
        case "storage":
            return isEntireHome ? 0 : STORAGE_CAGE_COST_PER_WEEK;
        default:
            return 0;
    }
}

export const toggleInclusion = (inclusions: Inclusions, type: InclusionType): Inclusions => {
    const current = inclusions[type];
    return {
        ...inclusions,
        [type]: { selected: !current?.selected, price: current?.price ?? 0 },
    };
};

export function toggleInclusionWithPrice(params: {
    inclusions: Inclusions;
    type: InclusionType;
    property: Property;
    isEntireHome: boolean;
    effectiveOccupancyType: "single" | "dual";
    rentalDurationMonths: number;
}): Inclusions {
    const {
        inclusions,
        type,
        property,
        isEntireHome,
        effectiveOccupancyType,
        rentalDurationMonths,
    } = params;

    const current = inclusions[type];
    const nextSelected = !(current?.selected ?? false);
    const price = nextSelected
        ? getInclusionPricePerWeek({
              type,
              property,
              isEntireHome,
              effectiveOccupancyType,
              rentalDurationMonths,
          })
        : 0;

    return {
        ...inclusions,
        [type]: { selected: nextSelected, price },
    };
}
