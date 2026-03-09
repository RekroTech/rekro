import { InclusionType, Inclusions, type Property } from "@/types/property.types";
import {
    CARPARK_COST_PER_WEEK,
    FURNITURE_COST,
    PRICING_CONFIG,
    STORAGE_CAGE_COST_PER_WEEK,
} from "@/lib/config/pricing_config";
import { getBillsCostPerWeek, getEntireHomeCleaningCosts } from "@/lib/utils/pricing";

const INCLUSION_TYPES: readonly InclusionType[] = [
    "furniture",
    "bills",
    "cleaning",
    "carpark",
    "storage",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toNumber(value: unknown): number | null {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "") {
        const n = Number(value);
        if (Number.isFinite(n)) return n;
    }
    return null;
}

export type InclusionsParseMode = "strict" | "coerce";

export interface ParseInclusionsOptions {
    /**
     * strict: invalid shapes cause an error
     * coerce: invalid shapes are dropped and defaults applied
     */
    mode?: InclusionsParseMode;
}

/**
 * Canonical inclusions shape:
 * Partial<Record<InclusionType, { selected: boolean; price: number }>>
 */
export function parseInclusions(input: unknown, options: ParseInclusionsOptions = {}): Inclusions {
    const mode = options.mode ?? "strict";

    if (input == null) return {};
    if (!isRecord(input)) {
        if (mode === "coerce") return {};
        throw new Error("Invalid inclusions: expected an object");
    }

    const result: Inclusions = {};

    for (const type of INCLUSION_TYPES) {
        const raw = (input as Record<string, unknown>)[type];
        if (raw == null) continue;

        if (!isRecord(raw)) {
            if (mode === "strict") throw new Error(`Invalid inclusions.${type}: expected an object`);
            continue;
        }

        const selectedRaw = raw.selected;
        const priceRaw = raw.price;

        const selected = typeof selectedRaw === "boolean" ? selectedRaw : null;
        const price = toNumber(priceRaw);

        if (selected === null || price === null) {
            if (mode === "strict") {
                throw new Error(
                    `Invalid inclusions.${type}: expected { selected: boolean; price: number }`
                );
            }
            // coerce mode: best effort
            result[type] = {
                selected: selected ?? false,
                price: price ?? 0,
            };
            continue;
        }

        result[type] = { selected, price };
    }

    return result;
}


export const isInclusionSelected = (inclusions: Inclusions, type: InclusionType): boolean => {
    return inclusions[type]?.selected ?? false;
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
                return getEntireHomeCleaningCosts(
                    property.units || [],
                    property.bedrooms
                ).regularWeekly;
            }
            return effectiveOccupancyType === "dual"
                ? PRICING_CONFIG.regularCleaningDualOccupiedPerWeek
                : PRICING_CONFIG.regularCleaningPerRoomPerWeek;
        }
        case "carpark":
            return isEntireHome ? 0 : CARPARK_COST_PER_WEEK;
        case "storage":
            return isEntireHome ? 0 : STORAGE_CAGE_COST_PER_WEEK;
        default:
            return 0;
    }
}

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
