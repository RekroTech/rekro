// Database types and utilities
// This file can be used for database-related types and helper functions

import { Inclusions } from "@/components/Property/types";

// User role types matching database enum
export type AppRole = "tenant" | "landlord" | "admin" | "super_admin";

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

export type Gender = "male" | "female" | "non_binary" | "prefer_not_to_say";
export type PreferredContactMethod = "email" | "phone" | "sms";

// Employment and student status types matching database constraints
export type EmploymentStatus = "working" | "not_working";
export type StudentStatus = "student" | "not_student";


// Application enum types
export type ApplicationType = "individual" | "group";
export type ApplicationStatus =
    | "draft"
    | "submitted"
    | "under_review"
    | "approved"
    | "rejected"
    | "withdrawn";
export type OccupancyType = "single" | "dual";

export type DocumentType =
    | "passport"
    | "visa"
    | "drivingLicense"
    | "studentId"
    | "coe"
    | "employmentLetter"
    | "payslips"
    | "bankStatement"
    | "proofOfFunds"
    | "referenceLetter"
    | "guarantorLetter"

export type Document = {
        url: string;
        path: string;
        uploadedAt: string;
        filename: string;
};

export type Documents = Partial<Record<DocumentType, Document>>

export interface Database {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string;
                    email: string | null;
                    full_name: string | null;
                    username: string | null;
                    image_url: string | null;
                    phone: string | null;
                    current_location: Record<string, unknown> | null;
                    native_language: string | null;
                    receive_marketing_email: boolean | null;
                    created_at: string;
                    updated_at: string;
                    date_of_birth: string | null; // date in DB
                    gender: Gender;
                    occupation: string | null;
                    bio: string | null;
                    preferred_contact_method: PreferredContactMethod;
                    notification_preferences: Record<string, unknown> | null;
                    last_login_at: string | null;
                };
                Insert: {
                    id: string;
                    email?: string | null;
                    full_name?: string | null;
                    username?: string | null;
                    image_url?: string | null;
                    phone?: string | null;
                    current_location?: Record<string, unknown> | null;
                    native_language?: string | null;
                    receive_marketing_email?: boolean | null;
                    created_at?: string;
                    updated_at?: string;
                    date_of_birth?: string | null;
                    gender?: Gender;
                    occupation?: string | null;
                    bio?: string | null;
                    preferred_contact_method?: PreferredContactMethod;
                    notification_preferences?: Record<string, unknown> | null;
                    last_login_at?: string | null;
                };
                Update: {
                    email?: string | null;
                    full_name?: string | null;
                    username?: string | null;
                    image_url?: string | null;
                    phone?: string | null;
                    current_location?: Record<string, unknown> | null;
                    native_language?: string | null;
                    receive_marketing_email?: boolean | null;
                    updated_at?: string;
                    date_of_birth?: string | null;
                    gender?: Gender;
                    occupation?: string | null;
                    bio?: string | null;
                    preferred_contact_method?: PreferredContactMethod;
                    notification_preferences?: Record<string, unknown> | null;
                    last_login_at?: string | null;
                };
            };
            user_application_profile: {
                Row: {
                    user_id: string;
                    visa_status: string | null;
                    employment_status: EmploymentStatus;
                    employment_type: string | null;
                    income_source: string | null;
                    income_frequency: string | null;
                    income_amount: number | null;
                    student_status: StudentStatus;
                    finance_support_type: string | null;
                    finance_support_details: string | null;
                    preferred_locality: string | null;
                    max_budget_per_week: number | null;
                    has_pets: boolean | null;
                    smoker: boolean | null;
                    emergency_contact_name: string | null;
                    emergency_contact_phone: string | null;
                    documents: Documents;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    user_id: string;
                    visa_status?: string | null;
                    employment_status?: EmploymentStatus;
                    employment_type?: string | null;
                    income_source?: string | null;
                    income_frequency?: string | null;
                    income_amount?: number | null;
                    student_status?: StudentStatus;
                    finance_support_type?: string | null;
                    finance_support_details?: string | null;
                    preferred_locality?: string | null;
                    max_budget_per_week?: number | null;
                    has_pets?: boolean | null;
                    smoker?: boolean | null;
                    emergency_contact_name?: string | null;
                    emergency_contact_phone?: string | null;
                    documents?: Documents;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    visa_status?: string | null;
                    employment_status?: EmploymentStatus;
                    employment_type?: string | null;
                    income_source?: string | null;
                    income_frequency?: string | null;
                    income_amount?: number | null;
                    student_status?: StudentStatus;
                    finance_support_type?: string | null;
                    finance_support_details?: string | null;
                    preferred_locality?: string | null;
                    max_budget_per_week?: number | null;
                    has_pets?: boolean | null;
                    smoker?: boolean | null;
                    emergency_contact_name?: string | null;
                    emergency_contact_phone?: string | null;
                    documents?: Documents;
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
                    price: number;
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
                    price?: number;
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
                    price?: number;
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
                    price: number;
                    bond_amount: number | null;
                    bills_included: boolean | null;
                    min_lease: number | null;
                    max_lease: number | null;
                    max_occupants: number | null;
                    size_sqm: number | null;
                    is_active: boolean | null;
                    created_at: string;
                    available_from: string | null;
                    available_to: string | null;
                    is_available: boolean;
                };
                Insert: {
                    id?: string;
                    property_id: string;
                    listing_type: ListingType;
                    name?: string | null;
                    description?: string | null;
                    price: number;
                    bond_amount?: number | null;
                    bills_included?: boolean | null;
                    min_lease?: number | null;
                    max_lease?: number | null;
                    max_occupants?: number | null;
                    size_sqm?: number | null;
                    is_active?: boolean | null;
                    created_at?: string;
                    available_from?: string | null;
                    available_to?: string | null;
                    is_available?: boolean;
                };
                Update: {
                    id?: string;
                    property_id?: string;
                    listing_type?: ListingType;
                    name?: string | null;
                    description?: string | null;
                    price?: number;
                    bond_amount?: number | null;
                    bills_included?: boolean | null;
                    min_lease?: number | null;
                    max_lease?: number | null;
                    max_occupants?: number | null;
                    size_sqm?: number | null;
                    is_active?: boolean | null;
                    available_from?: string | null;
                    available_to?: string | null;
                    is_available?: boolean;
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
                    move_in_date: string | null; // date in DB
                    rental_duration: number | null;
                    proposed_rent: number | null;
                    total_rent: number | null;
                    inclusions: Inclusions;
                    occupancy_type: OccupancyType;
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
                    move_in_date?: string | null; // date in DB
                    rental_duration?: number | null;
                    proposed_rent?: number | null;
                    total_rent?: number | null;
                    inclusions?: Inclusions;
                    occupancy_type?: OccupancyType;
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
                    move_in_date?: string | null; // date in DB
                    rental_duration?: number | null;
                    proposed_rent?: number | null;
                    total_rent?: number | null;
                    inclusions?: Inclusions;
                    occupancy_type?: OccupancyType;
                };
            };
            application_snapshot: {
                Row: {
                    id: string;
                    application_id: string;
                    snapshot: Record<string, unknown>;
                    created_at: string;
                    created_by: string | null;
                    note: string | null;
                };
                Insert: {
                    id?: string;
                    application_id: string;
                    snapshot: Record<string, unknown>;
                    created_at?: string;
                    created_by?: string | null;
                    note?: string | null;
                };
                Update: {
                    application_id?: string;
                    snapshot?: Record<string, unknown>;
                    created_by?: string | null;
                    note?: string | null;
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

export type ApplicationSnapshot = Database["public"]["Tables"]["application_snapshot"]["Row"];
export type ApplicationSnapshotInsert = Database["public"]["Tables"]["application_snapshot"]["Insert"];
export type ApplicationSnapshotUpdate = Database["public"]["Tables"]["application_snapshot"]["Update"];

export type UserRole = Database["public"]["Tables"]["user_roles"]["Row"];
export type UserRoleInsert = Database["public"]["Tables"]["user_roles"]["Insert"];
export type UserRoleUpdate = Database["public"]["Tables"]["user_roles"]["Update"];

export type UserApplicationProfile =
    Database["public"]["Tables"]["user_application_profile"]["Row"];
export type UserApplicationProfileInsert =
    Database["public"]["Tables"]["user_application_profile"]["Insert"];
export type UserApplicationProfileUpdate =
    Database["public"]["Tables"]["user_application_profile"]["Update"];

