// Application types

import { ApplicationStatus, ApplicationType } from "@/types/db";

export interface Application {
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
}

export interface ApplicationDetails {
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
}

export interface ApplicationFormData {
    fullName: string;
    email: string;
    phone: string;
    moveInDate: string;
    rentalDuration: string;
    employmentStatus: string;
    incomeSource: string;
    hasPets: boolean;
    smoker: boolean;
    additionalInfo: string;
    message: string;
}

export interface CreateApplicationRequest {
    propertyId: string;
    unitId?: string | null;
    applicationType: ApplicationType;
    formData: ApplicationFormData;
}
