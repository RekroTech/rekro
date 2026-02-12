export const PROPERTY_TYPES = [
    { value: "", label: "Select property type" },
    { value: "house", label: "House" },
    { value: "apartment", label: "Apartment" },
    { value: "townhouse", label: "Townhouse" },
    { value: "villa", label: "Villa" },
    { value: "studio", label: "Studio" },
    { value: "land", label: "Land" },
];

export const LISTING_TYPES = [
    { value: "all", label: "All" },
    { value: "entire_home", label: "Entire Home" },
    { value: "room", label: "Private Room" },
];

export const DEFAULT_FORM_DATA = {
    title: "",
    description: "",
    property_type: "",
    bedrooms: "1",
    bathrooms: "1",
    car_spaces: "",
    furnished: false,
    amenities: [],
    address_full: "",
    address_street: "",
    address_city: "",
    address_state: "",
    address_postcode: "",
    address_country: "Australia",
    price: "",
    latitude: undefined,
    longitude: undefined,
};

export const DEFAULT_UNIT_DATA = {
    listing_type: "entire_home" as const,
    name: "",
    unit_description: "",
    price: "",
    bond_amount: "",
    bills_included: false,
    min_lease: "4",
    max_lease: "12",
    max_occupants: "",
    size_sqm: "",
    available_from: "",
    available_to: "",
    is_available: true,
    availability_notes: "",
};

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

    // Lease period multipliers
    leaseMultipliers: {
        4: 1.575, // 4 months: 6 month * 1.05 * 1.5
        6: 1.05, // 6 months
        9: 4 / 3, // 9 months
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

// Parking options
export const PARKING_OPTIONS = [
    "Garage",
    "Carport",
    "Underground",
    "Secure",
    "Street",
    "Driveway",
    "Visitor",
    "Tandem",
] as const;

export const AMENITIES = [
    "Air Conditioning",
    "Heating",
    "Wi-Fi",
    "Pool",
    "Gym",
    "Laundry",
    "Dishwasher",
    "Balcony",
    "Garden",
    "Pet Friendly",
    "Security System",
    "BBQ Area",
    "Study Room",
    "Storage",
    "Elevator",
] as const;
