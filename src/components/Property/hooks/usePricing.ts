import { useMemo } from "react";
import type { Unit } from "@/types/db";
import type { Property } from "@/types/property.types";
import type { RentalFormData } from "@/components/Property/types";
import { calculatePricing } from "@/components/Property/pricing";

interface UsePricingParams {
    selectedUnit: Unit | null;
    property: Property;
    rentalForm: RentalFormData;
    dynamicPricing?: Record<string, number>;
}

interface PricingResult {
    baseRent: number;
    adjustedBaseRent: number;
    bond: number;
    inclusionsCosts: {
        furniture: number;
        bills: number;
        cleaning: number;
        carpark: number;
        storage: number;
        total: number;
    };
    totalWeeklyRent: number;
    occupancyType: "single" | "dual";
}

/**
 * Custom hook to calculate pricing for a property unit
 * Encapsulates all pricing calculation logic with proper memoization
 *
 * @param params - Pricing calculation parameters
 * @returns Memoized pricing result
 */
export function usePricing({
    selectedUnit,
    property,
    rentalForm,
    dynamicPricing,
}: UsePricingParams): PricingResult {
    return useMemo(() => {
        return calculatePricing({
            selectedUnit,
            property,
            rentalForm,
            dynamicPricing,
        });
    }, [selectedUnit, property, rentalForm, dynamicPricing]);
}

