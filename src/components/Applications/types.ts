import type { Address, Location, Documents } from "@/types/db";

export interface ApplicationWithDetails {
    id: string;
    status: string;
    created_at: string;
    submitted_at: string;
    updated_at: string;
    move_in_date: string;
    rental_duration: number;
    proposed_rent: number | null;
    total_rent: number;
    message: string | null;
    properties: {
        id: string;
        title: string;
        address: Address;
        images: string[] | null;
        location: Location;
    };
    units: {
        id: string;
        name: string;
        listing_type: string;
        price: number;
    };
    applicant?: {
        id: string;
        full_name: string | null;
        email: string | null;
        phone: string | null;
        image_url: string | null;
        date_of_birth: string | null;
        gender: string | null;
        occupation: string | null;
        bio: string | null;
        user_application_profile?: {
            visa_status: string | null;
            employment_status: string | null;
            employment_type: string | null;
            income_source: string | null;
            income_frequency: string | null;
            income_amount: number | null;
            student_status: string | null;
            finance_support_type: string | null;
            finance_support_details: string | null;
            has_pets: boolean | null;
            smoker: boolean | null;
            emergency_contact_name: string | null;
            emergency_contact_phone: string | null;
            documents: Documents;
        };
    };
}

export interface GroupedApplication {
    property: ApplicationWithDetails["properties"];
    applications: ApplicationWithDetails[];
}

