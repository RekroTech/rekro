/**
 * Pricing formulas for calculating room rents based on base property rent
 *
 * EDGE CASE HANDLING:
 * - All inputs are normalized to safe finite numbers (≥ 0)
 * - Occupancy is clamped to [1, maxCapacity]
 * - Single shared drift-fix implementation prevents rounding errors
 * - Dynamic pricing and legacy dual premium are mutually exclusive
 * - No NaN/Infinity paths - all public functions return finite numbers
 */
import type { Unit } from "@/types/db";
import type { Property } from "@/types/property.types";
import { RentalFormData } from "@/components/Property/types";
import {
    PRICING_CONFIG,
    FURNITURE_COST,
    CARPARK_COST_PER_WEEK,
    STORAGE_CAGE_COST_PER_WEEK,
} from "@/components/Property/constants";
import {
    getBillsCostPerWeek,
    getEntireHomeCleaningCosts,
    getRegularCleaningCostPerWeek,
    getRoomFurnitureCost,
    isInclusionSelected,
} from "@/components/Property/utils";

type PricingInputs = {
    leaseWeekly: number; // X - base weekly rent
    bedrooms: number; // R - number of bedrooms
    bathrooms?: number; // optional if needed later
    furnishedByYou: boolean; // true if property is unfurnished and you will furnish
};

type Room = {
    id: string;
    maxCapacity: number;
    selectedOccupancy?: number;
};

// ============================================
// UTILITY FUNCTIONS - Input Normalization & Rounding
// ============================================

/**
 * Normalize a weekly rent value to a safe finite number ≥ 0
 * Handles: null, undefined, NaN, Infinity, negative values
 */
function normalizeWeeklyRent(value: number | null | undefined): number {
    if (value == null || !isFinite(value) || value < 0) {
        return 0;
    }
    return value;
}

/**
 * Normalize occupancy to [1, maxCapacity]
 * Handles: null, undefined, NaN, out-of-range values
 */
function normalizeOccupancy(value: number | null | undefined, maxCapacity: number): number {
    const max = Math.max(1, maxCapacity);
    if (value == null || !isFinite(value)) {
        return 1;
    }
    return Math.max(1, Math.min(max, Math.floor(value)));
}

/**
 * Round to nearest step, with safety guards
 * If step is invalid (≤ 0, NaN, Infinity), returns rounded integer
 */
function roundToStep(n: number, step: number): number {
    if (!isFinite(n)) return 0;
    if (!isFinite(step) || step <= 0) return Math.round(n);
    return Math.round(n / step) * step;
}

/**
 * SHARED DRIFT-FIX IMPLEMENTATION
 * Adjusts rounded values so their sum exactly equals targetTotal
 *
 * Algorithm:
 * 1. Calculate difference between target and current sum
 * 2. Distribute difference by adding/subtracting step increments
 * 3. For positive diff: add to highest-weight items first
 * 4. For negative diff: subtract from lowest-weight items first (never go negative)
 *
 * Guards against infinite loops with max iterations
 */
function fixRoundingDrift(params: {
    targetTotal: number;
    values: number[];
    step: number;
    weights: number[];
}): number[] {
    const { targetTotal, values, step, weights } = params;

    if (values.length === 0) return [];
    if (!isFinite(step) || step <= 0) return values;

    const result = [...values];
    let diff = targetTotal - result.reduce((a, b) => a + b, 0);

    const idxs = [...Array(values.length).keys()];
    const order =
        diff >= 0
            ? idxs.sort((i, j) => weights[j]! - weights[i]!) // add to highest-weight first
            : idxs.sort((i, j) => weights[i]! - weights[j]!); // subtract from lowest-weight first

    let guard = 0;
    const maxIterations = 10000;

    while (Math.abs(diff) >= 0.01 && guard < maxIterations) {
        let progressMade = false;

        for (const idx of order) {
            if (Math.abs(diff) < 0.01) break;

            if (diff > 0) {
                result[idx]! += step;
                diff -= step;
                progressMade = true;
            } else if (diff < 0) {
                const next = result[idx]! - step;
                if (next >= 0) {
                    result[idx] = next;
                    diff += step;
                    progressMade = true;
                }
            }
        }

        // If no progress can be made, break to prevent infinite loop
        if (!progressMade) break;
        guard++;
    }

    return result;
}

// ============================================
// MAIN PRICING API
// ============================================

/**
 * Single consolidated function to calculate all pricing
 *
 * GUARANTEES:
 * - Uses selectedUnit.price as canonical weekly rent (normalized to finite ≥ 0)
 * - Dynamic pricing and legacy dual premium are mutually exclusive
 * - All returned values are finite numbers (no NaN/Infinity)
 * - Bond calculated from base rent before lease adjustments
 * - Furniture cost guards against division by zero
 */
export function calculatePricing(params: {
    selectedUnit: Unit | null;
    property: Property;
    rentalForm: RentalFormData;
}) {
    const { selectedUnit, property, rentalForm } = params;

    // Early return if no unit selected
    if (!selectedUnit) {
        return {
            baseRent: 0,
            adjustedBaseRent: 0,
            bond: 0,
            inclusionsCosts: {
                furniture: 0,
                bills: 0,
                cleaning: 0,
                carpark: 0,
                storage: 0,
                total: 0,
            },
            totalWeeklyRent: 0,
            occupancyType: "single" as const,
        };
    }

    const isEntireHome = selectedUnit.listing_type === "entire_home";
    const isRoomListing = selectedUnit.listing_type === "room";
    const canBeDualOccupancy = !isEntireHome && selectedUnit.max_occupants === 2;
    const isDualOccupancy = canBeDualOccupancy && rentalForm.occupancyType === "dual";

    // CANONICAL WEEKLY RENT: Normalize selectedUnit.price to safe value
    const canonicalWeeklyRent = normalizeWeeklyRent(selectedUnit.price);
    let baseRent = canonicalWeeklyRent;

    // DYNAMIC PRICING vs LEGACY DUAL PREMIUM (mutually exclusive)
    let usedDynamicPricing = false;

    // For room listings with multiple units, check if dynamic pricing should apply
    if (isRoomListing && property.units && property.units.length > 1) {
        // For now, dynamic pricing is disabled in this simplified version
        // It would require tracking occupancies for all units, not just the selected one
        usedDynamicPricing = false;
    }

    // Legacy dual occupancy premium (only if dynamic pricing was NOT used)
    if (!usedDynamicPricing && isDualOccupancy) {
        baseRent += PRICING_CONFIG.dualOccupancyPremium;
    }

    // Apply lease period multiplier (with fallback to 1.0)
    const rentalDuration = rentalForm.rentalDuration;
    const multiplier = PRICING_CONFIG.leaseMultipliers[rentalDuration] ?? 1;
    const adjustedBaseRent = Math.round(baseRent * multiplier);

    // Bond is 4x base rent (before lease adjustments)
    const bond = Math.round(baseRent * 4);

    // Calculate inclusions costs
    // NOTE: For room listings, furniture + bills are already included in the base rent.
    // They should not be treated as paid add-ons.

    // FURNITURE: Guard against division by zero
    const leaseDivisor = rentalDuration && rentalDuration > 0 ? rentalDuration * 4.33 : 1;

    const furnitureSelected = isInclusionSelected(rentalForm.inclusions, "furniture");
    const furniture =
        !isRoomListing && furnitureSelected
            ? Math.round((isEntireHome
                  ? FURNITURE_COST
                  : getRoomFurnitureCost(property.units || [], FURNITURE_COST)) / leaseDivisor)
            : 0;

    const billsSelected = isInclusionSelected(rentalForm.inclusions, "bills");
    const bills = !isRoomListing && billsSelected ? getBillsCostPerWeek(property.bedrooms) : 0;

    const cleaningSelected = isInclusionSelected(rentalForm.inclusions, "cleaning");
    const cleaning = cleaningSelected
        ? isEntireHome
            ? getEntireHomeCleaningCosts(property.units || []).regularWeekly
            : getRegularCleaningCostPerWeek(isDualOccupancy)
        : 0;

    const carparkSelected = isInclusionSelected(rentalForm.inclusions, "carpark");
    const carpark = !isEntireHome && carparkSelected ? CARPARK_COST_PER_WEEK : 0;

    const storageSelected = isInclusionSelected(rentalForm.inclusions, "storage");
    const storage = !isEntireHome && storageSelected ? STORAGE_CAGE_COST_PER_WEEK : 0;

    const inclusionsTotal = Math.round(furniture + bills + cleaning + carpark + storage);
    const totalWeeklyRent = Math.round(adjustedBaseRent + inclusionsTotal);

    return {
        baseRent,
        adjustedBaseRent,
        bond,
        inclusionsCosts: {
            furniture,
            bills,
            cleaning,
            carpark,
            storage,
            total: inclusionsTotal,
        },
        totalWeeklyRent,
        occupancyType: rentalForm.occupancyType,
    };
}

// ============================================
// PURE PRICING FORMULAS (Save-time & Selection-time models)
// ============================================

/**
 * Compute target rent (save-time model)
 * Assumes all rooms are single occupancy (P = R)
 *
 * Returns: Finite number ≥ 0 (all inputs normalized)
 */
export function computeTargetRentSaveTime({
    leaseWeekly,
    bedrooms,
    furnishedByYou,
}: PricingInputs): number {
    const X = normalizeWeeklyRent(leaseWeekly);
    const R = Math.max(1, Math.floor(bedrooms) || 1);
    const P = R; // save-time assumption: all single occupancy

    const m = PRICING_CONFIG.margin;
    const u = PRICING_CONFIG.utilitiesPerPerson;
    const a = PRICING_CONFIG.furnishingPerRoom;
    const k = PRICING_CONFIG.fixedBuffer;

    const furnishing = furnishedByYou ? a * R : 0;

    const T = X * (1 + m) + u * P + furnishing + k;

    return Math.max(0, Math.round(T));
}

/**
 * Target revenue as a function of actual occupants P (selection-time model)
 * This accounts for density surcharge when P exceeds bedrooms
 *
 * Returns: Finite number ≥ 0 (all inputs normalized)
 */
export function computeTargetRentSelectionTime(inputs: PricingInputs, occupants: number): number {
    const X = normalizeWeeklyRent(inputs.leaseWeekly);
    const R = Math.max(1, Math.floor(inputs.bedrooms) || 1);
    const P = Math.max(1, Math.floor(occupants) || 1);

    const m = PRICING_CONFIG.margin;
    const u = PRICING_CONFIG.utilitiesPerPerson;
    const s = PRICING_CONFIG.extraPersonSurcharge;
    const a = PRICING_CONFIG.furnishingPerRoom;
    const k = PRICING_CONFIG.fixedBuffer;

    const furnishing = inputs.furnishedByYou ? a * R : 0;

    // density surcharge only when P exceeds bedrooms
    const density = s * Math.max(0, P - R);

    const T = X * (1 + m) + u * P + density + furnishing + k;
    return Math.max(0, Math.round(T));
}

type RoomMeta = {
    maxCapacity: number;
};

/**
 * Distribute T across rooms using weights.
 * Save-time: all rooms are "single occupied", but 2-cap rooms get a premium weight.
 *
 * Uses shared drift-fix implementation to ensure sum exactly equals T
 * Returns: Array of finite numbers ≥ 0
 */
export function computeRoomRentsSaveTimeWeighted(
    T: number,
    rooms: RoomMeta[],
    opts?: {
        roundStep?: number;
        twoCapSinglePremium?: number;
    }
): number[] {
    const roundStep = opts?.roundStep ?? PRICING_CONFIG.roundStep;
    const premium = opts?.twoCapSinglePremium ?? PRICING_CONFIG.twoCapacityPremium;

    const R = rooms.length;
    if (R === 0) return [];

    const targetTotal = Math.max(0, normalizeWeeklyRent(T));

    // Weight logic:
    // cap=1 -> weight 1.0
    // cap=2 -> weight 1.0 + premium (e.g. 1.15)
    const weights = rooms.map((r) => (r.maxCapacity === 2 ? 1 + premium : 1));
    const W = weights.reduce((a, b) => a + b, 0) || 1;

    // Raw rents
    const raw = weights.map((w) => (targetTotal * w) / W);

    // Round each room to step
    const rounded = raw.map((x) => roundToStep(x, roundStep));

    // Use shared drift-fix implementation
    return fixRoundingDrift({
        targetTotal,
        values: rounded,
        step: roundStep,
        weights,
    });
}

/**
 * Calculate entire home rent with flat markup from config
 * Returns the weekly rent for entire home listing
 *
 * Returns: Finite number ≥ 0
 */
export function calculateEntireHomeRent(basePrice: number): number {
    const normalizedPrice = normalizeWeeklyRent(basePrice);
    const rent = normalizedPrice * (1 + PRICING_CONFIG.entireHomeMarkup);
    return roundToStep(rent, PRICING_CONFIG.roundStep);
}

/**
 * Calculate room rents from base property price using weighted distribution
 * Returns an array of weekly rents for each room based on their capacity
 *
 * Returns: Array of finite numbers ≥ 0
 */
export function calculateRoomRents(
    basePrice: number,
    rooms: RoomMeta[],
    isFurnished: boolean
): number[] {
    const normalizedPrice = normalizeWeeklyRent(basePrice);
    const bedrooms = Math.max(1, rooms.length);
    const furnishedByYou = !isFurnished;

    const targetRent = computeTargetRentSaveTime({
        leaseWeekly: normalizedPrice,
        bedrooms,
        furnishedByYou,
    });

    return computeRoomRentsSaveTimeWeighted(targetRent, rooms, {
        twoCapSinglePremium: PRICING_CONFIG.twoCapacityPremium,
        roundStep: PRICING_CONFIG.roundStep,
    });
}

/**
 * Recalculate rents when user changes occupancy selection.
 * - Single rooms: weight 1.0
 * - 2-cap room single-occupied: weight 1.0 + premium (e.g. 1.15)
 * - Dual-occupied room: total = 2 * d * baseSingle, so weight = 2d (e.g. 1.6)
 *
 * Solve: baseSingle = T / sum(weights)
 * Then roomRent = baseSingle * weight
 *
 * Uses shared drift-fix implementation to ensure sum equals targetRent
 * Returns: { targetRent, occupants, roomRentsById } with all finite numbers
 */
export function updateRoomRentsOnOccupancySelection(
    leaseWeekly: number,
    rooms: Room[],
    isFurnished: boolean
): {
    targetRent: number;
    occupants: number;
    roomRentsById: Record<string, number>;
} {
    const normalizedLease = normalizeWeeklyRent(leaseWeekly);
    const R = Math.max(1, rooms.length);
    const furnishedByYou = !isFurnished;

    // 1) Normalize occupancy for each room (default 1, clamp to maxCapacity)
    const occs: number[] = rooms.map((r) => normalizeOccupancy(r.selectedOccupancy, r.maxCapacity));

    // 2) Actual occupants P
    const occupants = occs.reduce((a, b) => a + b, 0);

    // 3) Target revenue T(P)
    const targetRent = computeTargetRentSelectionTime(
        { leaseWeekly: normalizedLease, bedrooms: R, furnishedByYou },
        occupants
    );

    // 4) Build weights
    const premium = PRICING_CONFIG.twoCapacityPremium;
    const d = PRICING_CONFIG.sharedDiscount;

    const weights = rooms.map((r, idx) => {
        const occ = occs[idx]!;

        if (occ === 2) {
            // dual room total = 2 * d * baseSingle => weight = 2d
            return 2 * d;
        }

        // occ === 1
        if (r.maxCapacity === 2) return 1 + premium;
        return 1;
    });

    const W = weights.reduce((a, b) => a + b, 0) || 1;

    // 5) Compute raw rents then round
    const step = PRICING_CONFIG.roundStep;
    const baseSingle = targetRent / W;

    const rawRents = weights.map((w) => baseSingle * w);
    const rounded = rawRents.map((x) => roundToStep(x, step));

    // 6) Use shared drift-fix implementation
    const fixedRents = fixRoundingDrift({
        targetTotal: targetRent,
        values: rounded,
        step,
        weights,
    });

    // 7) Map to ids
    const roomRentsById: Record<string, number> = {};
    rooms.forEach((r, i) => {
        roomRentsById[r.id] = fixedRents[i]!;
    });

    return { targetRent, occupants, roomRentsById };
}
