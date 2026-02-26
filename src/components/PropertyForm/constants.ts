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
    min_lease: "6",
    max_lease: "12",
    max_occupants: "",
    size_sqm: "",
    available_from: "",
    available_to: "",
    is_available: true,
    availability_notes: "",
};