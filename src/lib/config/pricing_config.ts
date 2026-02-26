// ============================================
// PRICING CONFIGURATION
// Centralized pricing constants - tweak these to adjust pricing across the entire app
// ============================================
export const PRICING_CONFIG = {
    // Base pricing formula (save-time model)
    margin: 0.2, // 30% profit margin
    utilitiesPerPerson: 25, // Weekly utilities cost per person
    extraPersonSurcharge: 30, // Density surcharge when occupants exceed bedrooms
    furnishingPerRoom: 20, // Weekly furnishing cost per room (if unfurnished)
    fixedBuffer: 50, // Fixed weekly buffer amount

    // Entire home markup
    entireHomeMarkup: 0.1, // 12% markup for entire home listings

    // Room pricing weights (save-time and selection-time models)
    twoCapacityPremium: 0.15, // 15% premium for 2-capacity rooms over 1-capacity (single occupancy)
    sharedDiscount: 0.8, // Each person in dual-occupied room pays 80% of single-room base
    roundStep: 5, // Round prices to nearest $5

    // Room area weighting (optional)
    // - If a room has size_sqm and alpha > 0, we bias weights so larger rooms cost a bit more.
    // - Missing/invalid sizes are treated as neutral (factor 1.0).
    // - Ratios are calculated relative to the median sized room, then clamped.
    roomAreaWeightAlpha: 0.5, // 0 disables; 0.5 means 50% of area difference affects weight
    roomAreaMinRatio: 0.75, // smallest room can be treated as at least 75% of reference size
    roomAreaMaxRatio: 1.35, // largest room can be treated as at most 135% of reference size

    // Lease period multipliers
    leaseMultipliers: {
        3: 2.1, // 3 months
        6: 1.05, // 6 months
        12: 1, // 12 months (base)
    } as Record<number, number>,

    // Add-ons
    furnitureCost: 2500, // One-time furniture cost
    carparkCostPerWeek: 25,
    storageCageCostPerWeek: 15,

    // Cleaning costs
    regularCleaningPerRoomPerWeek: 35,
    regularCleaningDualOccupiedPerWeek: 60,
    endOfLeaseCleaningBase: 200, // Per room for 2+ bed, base for studio/1bed

    // Dual occupancy
    dualOccupancyPremium: 100, // Additional weekly cost for dual occupancy
} as const;

// Legacy exports for backward compatibility
export const FURNITURE_COST = PRICING_CONFIG.furnitureCost;
export const CARPARK_COST_PER_WEEK = PRICING_CONFIG.carparkCostPerWeek;
export const STORAGE_CAGE_COST_PER_WEEK = PRICING_CONFIG.storageCageCostPerWeek;
export const REGULAR_CLEANING_COST_PER_ROOM_PER_WEEK = PRICING_CONFIG.regularCleaningPerRoomPerWeek;
export const REGULAR_CLEANING_COST_DUAL_OCCUPIED_PER_WEEK =
    PRICING_CONFIG.regularCleaningDualOccupiedPerWeek;
export const END_OF_LEASE_CLEANING_BASE = PRICING_CONFIG.endOfLeaseCleaningBase;

