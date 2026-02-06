// Database types and utilities
// This file can be used for database-related types and helper functions

export interface Address {
    street: string;
    city?: string;
    suburb?: string;
    state: string;
    postcode: string;
    country?: string;
}

export interface Location {
    city: string;
    state: string;
    country: string;
}

export type ListingType = "entire_home" | "room";

// User role types matching database enum
export type AppRole = "tenant" | "landlord" | "admin" | "super_admin";

// Application enum types
export type ApplicationType = "individual" | "group";
export type ApplicationStatus =
    | "draft"
    | "submitted"
    | "under_review"
    | "approved"
    | "rejected"
    | "withdrawn";

export interface Database {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string;
                    email: string;
                    name: string | null;
                    avatar_url: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id: string;
                    email: string;
                    name?: string | null;
                    avatar_url?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    email?: string;
                    name?: string | null;
                    avatar_url?: string | null;
                    updated_at?: string;
                };
            };
            properties: {
                Row: {
                    id: string;
                    landlord_id: string | null;
                    created_by: string | null;
                    title: string;
                    description: string | null;
                    address: Address | null;
                    location: Location | null;
                    latitude: number | null;
                    longitude: number | null;
                    property_type: string | null;
                    bedrooms: number | null;
                    bathrooms: number | null;
                    car_spaces: number | null;
                    furnished: boolean;
                    amenities: string[] | null;
                    images: string[] | null;
                    video_url: string | null;
                    is_published: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    landlord_id?: string | null;
                    created_by?: string | null;
                    title: string;
                    description?: string | null;
                    address?: Address | null;
                    location?: Location | null;
                    latitude?: number | null;
                    longitude?: number | null;
                    property_type?: string | null;
                    bedrooms?: number | null;
                    bathrooms?: number | null;
                    car_spaces?: number | null;
                    furnished?: boolean;
                    amenities?: string[] | null;
                    images?: string[] | null;
                    video_url?: string | null;
                    is_published?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    landlord_id?: string | null;
                    created_by?: string | null;
                    title?: string;
                    description?: string | null;
                    address?: Address | null;
                    location?: Location | null;
                    latitude?: number | null;
                    longitude?: number | null;
                    property_type?: string | null;
                    bedrooms?: number | null;
                    bathrooms?: number | null;
                    car_spaces?: number | null;
                    furnished?: boolean;
                    amenities?: string[] | null;
                    images?: string[] | null;
                    video_url?: string | null;
                    is_published?: boolean;
                    updated_at?: string;
                };
            };
            units: {
                Row: {
                    id: string;
                    property_id: string;
                    listing_type: ListingType;
                    name: string | null;
                    description: string | null;
                    price_per_week: number;
                    bond_amount: number | null;
                    bills_included: boolean | null;
                    min_lease_weeks: number | null;
                    max_lease_weeks: number | null;
                    max_occupants: number | null;
                    size_sqm: number | null;
                    is_active: boolean | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    property_id: string;
                    listing_type: ListingType;
                    name?: string | null;
                    description?: string | null;
                    price_per_week: number;
                    bond_amount?: number | null;
                    bills_included?: boolean | null;
                    min_lease_weeks?: number | null;
                    max_lease_weeks?: number | null;
                    max_occupants?: number | null;
                    size_sqm?: number | null;
                    is_active?: boolean | null;
                    created_at?: string;
                };
                Update: {
                    property_id?: string;
                    listing_type: ListingType;
                    name?: string | null;
                    description?: string | null;
                    price_per_week?: number;
                    bond_amount?: number | null;
                    bills_included?: boolean | null;
                    min_lease_weeks?: number | null;
                    max_lease_weeks?: number | null;
                    max_occupants?: number | null;
                    size_sqm?: number | null;
                    is_active?: boolean | null;
                };
            };
            unit_availability: {
                Row: {
                    id: string;
                    unit_id: string;
                    available_from: string | null;
                    available_to: string | null;
                    is_available: boolean | null;
                    notes: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    unit_id: string;
                    available_from?: string | null;
                    available_to?: string | null;
                    is_available?: boolean | null;
                    notes?: string | null;
                    created_at?: string;
                };
                Update: {
                    unit_id?: string;
                    available_from?: string | null;
                    available_to?: string | null;
                    is_available?: boolean | null;
                    notes?: string | null;
                };
            };
            property_shares: {
                Row: {
                    id: string;
                    shared_by: string | null;
                    unit_id: string | null;
                    channel: string | null;
                    to_value: string | null;
                    created_at: string | null;
                };
                Insert: {
                    id?: string;
                    shared_by?: string | null;
                    unit_id?: string | null;
                    channel?: string | null;
                    to_value?: string | null;
                    created_at?: string | null;
                };
                Update: {
                    shared_by?: string | null;
                    unit_id?: string | null;
                    channel?: string | null;
                    to_value?: string | null;
                };
            };
            applications: {
                Row: {
                    id: string;
                    user_id: string;
                    property_id: string;
                    unit_id: string | null;
                    application_type: ApplicationType;
                    status: ApplicationStatus;
                    message: string | null;
                    created_at: string;
                    submitted_at: string | null;
                    updated_at: string;
                    group_id: string | null;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    property_id: string;
                    unit_id?: string | null;
                    application_type: ApplicationType;
                    status?: ApplicationStatus;
                    message?: string | null;
                    created_at?: string;
                    submitted_at?: string | null;
                    updated_at?: string;
                    group_id?: string | null;
                };
                Update: {
                    user_id?: string;
                    property_id?: string;
                    unit_id?: string | null;
                    application_type?: ApplicationType;
                    status?: ApplicationStatus;
                    message?: string | null;
                    submitted_at?: string | null;
                    updated_at?: string;
                    group_id?: string | null;
                };
            };
            application_details: {
                Row: {
                    application_id: string;
                    move_in_date: string | null;
                    rental_duration: string | null;
                    employment_status: string | null;
                    income_source: string | null;
                    contact_phone: string | null;
                    has_pets: boolean | null;
                    smoker: boolean | null;
                    notes: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    application_id: string;
                    move_in_date?: string | null;
                    rental_duration?: string | null;
                    employment_status?: string | null;
                    income_source?: string | null;
                    contact_phone?: string | null;
                    has_pets?: boolean | null;
                    smoker?: boolean | null;
                    notes?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    move_in_date?: string | null;
                    rental_duration?: string | null;
                    employment_status?: string | null;
                    income_source?: string | null;
                    contact_phone?: string | null;
                    has_pets?: boolean | null;
                    smoker?: boolean | null;
                    notes?: string | null;
                    updated_at?: string;
                };
            };
            user_roles: {
                Row: {
                    user_id: string;
                    role: AppRole;
                    created_at: string | null;
                };
                Insert: {
                    user_id: string;
                    role: AppRole;
                    created_at?: string | null;
                };
                Update: {
                    user_id?: string;
                    role?: AppRole;
                };
            };
            // Add more tables as needed
        };
    };
}

// Export common types
export type Profile = Database["public"]["Tables"]["users"]["Row"];
export type ProfileInsert = Database["public"]["Tables"]["users"]["Insert"];
export type ProfileUpdate = Database["public"]["Tables"]["users"]["Update"];

export type Property = Database["public"]["Tables"]["properties"]["Row"];
export type PropertyInsert = Database["public"]["Tables"]["properties"]["Insert"];
export type PropertyUpdate = Database["public"]["Tables"]["properties"]["Update"];

export type Unit = Database["public"]["Tables"]["units"]["Row"];
export type UnitInsert = Database["public"]["Tables"]["units"]["Insert"];
export type UnitUpdate = Database["public"]["Tables"]["units"]["Update"];

export type UnitAvailability = Database["public"]["Tables"]["unit_availability"]["Row"];
export type UnitAvailabilityInsert = Database["public"]["Tables"]["unit_availability"]["Insert"];
export type UnitAvailabilityUpdate = Database["public"]["Tables"]["unit_availability"]["Update"];

export type PropertyShare = Database["public"]["Tables"]["property_shares"]["Row"];
export type PropertyShareInsert = Database["public"]["Tables"]["property_shares"]["Insert"];
export type PropertyShareUpdate = Database["public"]["Tables"]["property_shares"]["Update"];

export type Application = Database["public"]["Tables"]["applications"]["Row"];
export type ApplicationInsert = Database["public"]["Tables"]["applications"]["Insert"];
export type ApplicationUpdate = Database["public"]["Tables"]["applications"]["Update"];

export type ApplicationDetails = Database["public"]["Tables"]["application_details"]["Row"];
export type ApplicationDetailsInsert =
    Database["public"]["Tables"]["application_details"]["Insert"];
export type ApplicationDetailsUpdate =
    Database["public"]["Tables"]["application_details"]["Update"];

export type UserRole = Database["public"]["Tables"]["user_roles"]["Row"];
export type UserRoleInsert = Database["public"]["Tables"]["user_roles"]["Insert"];
export type UserRoleUpdate = Database["public"]["Tables"]["user_roles"]["Update"];
