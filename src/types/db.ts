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
