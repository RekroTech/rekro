export const PROPERTY_TYPES = [
    { value: "", label: "Any" },
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

export const STATUS_TABS = [
    { value: "active", label: "Active" },
    { value: "leased", label: "Leased" },
    { value: "inactive", label: "Inactive" },
];

export const LEASE_MONTH_OPTIONS = [
    { value: "3", label: "3 months" },
    { value: "6", label: "6 months" },
    { value: "12", label: "12 months" },
];

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
    "Air Conditioner",
    "Heater",
    "Wi-Fi",
    "Pool",
    "Gym",
    "Laundry",
    "Dishwasher",
    "Balcony",
    "Backyard",
    "Pet Friendly",
    "Security System",
    "BBQ Area",
    "Study Room",
    "Storage",
    "Lift",
] as const;

export const ROOM_UNIT_FEATURES = [
    "Single Bed",
    "Double Bed",
    "Queen Bed",
    "King Bed",
    "Bed Side Table",
    "Lamp",
    "Chair",
    "Couch",
    "TV",
    "Desk",
    "Wardrobe",
    "Drawers",
    "Air Conditioner",
    "Heater",
    "Kitchenette",
    "Ensuite",
    "Balcony",
] as const;

export const DEFAULT_FORM_DATA = {
    description: "",
    property_type: "",
    bedrooms: "1",
    bathrooms: "1",
    car_spaces: "",
    furnished: false,
    bills_included: false,
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
    min_lease: "6",
    max_lease: "12",
    max_occupants: "",
    size_sqm: "",
    available_from: "",
    available_to: "",
    status: "active" as const,
    features: [] as string[],
    availability_notes: "",
};