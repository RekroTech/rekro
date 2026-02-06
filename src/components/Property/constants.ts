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
    { value: "entire_home", label: "Entire Home (Whole Property)" },
    { value: "room", label: "Room (Shared/Single Room)" },
];

export const DEFAULT_FORM_DATA = {
    title: "",
    description: "",
    property_type: "",
    bedrooms: "",
    bathrooms: "",
    car_spaces: "",
    furnished: false,
    address_street: "",
    address_city: "",
    address_state: "",
    address_postcode: "",
    address_country: "Australia",
};

export const DEFAULT_UNIT_DATA = {
    name: "",
    unit_description: "",
    price_per_week: "",
    bond_amount: "",
    bills_included: false,
    min_lease_weeks: "",
    max_lease_weeks: "",
    max_occupants: "",
    size_sqm: "",
    available_from: "",
    available_to: "",
    is_available: true,
    availability_notes: "",
};
