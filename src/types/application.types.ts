// Application types
import { ApplicationType, OccupancyType } from "@/types/db";
import { Inclusions } from "@/components/Property/types";

export interface ApplicationFormData {
    moveInDate: string;
    rentalDuration: string;
    proposedRent?: string;
    totalRent?: number;
    inclusions: Inclusions;
    occupancyType: OccupancyType;
    message?: string;
}

// Application snapshot type - captures user profile + application data
export interface ApplicationSnapshot {
    // Application specific data
    lease: {
        moveInDate: string;
        rentalDuration: string;
        proposedRent: number;
        totalRent: number;
        applicationType: ApplicationType;
        submittedAt: string;
        inclusions: Inclusions;
        occupancyType: OccupancyType;
    };

    // User profile snapshot
    profile: {
        fullName: string | null;
        email: string | null;
        phone: string | null;
        dateOfBirth: string | null;
        gender: string | null;
        occupation: string | null;
        bio: string | null;
        nativeLanguage: string | null;
        visaStatus: string | null;
    };

    finance: {
        employmentStatus: string | null;
        employmentType: string | null;
        incomeSource: string | null;
        incomeFrequency: string | null;
        incomeAmount: number | null;
        studentStatus: string | null;
        financeSupportType: string | null;
        financeSupportDetails: string | null;
    };
    rental: {
        preferredLocality: string | null;
        maxBudgetPerWeek: number | null;
        hasPets: boolean | null;
        smoker: boolean | null;
        emergencyContactName: string | null;
        emergencyContactPhone: string | null;
    };
    documents: Record<string, unknown>;
}

export interface CreateApplicationRequest {
    applicationId?: string; // Optional: if provided, will update existing application
    propertyId: string;
    unitId?: string | null;
    applicationType: ApplicationType;
    moveInDate: string;
    rentalDuration: string;
    proposedRent?: string;
    totalRent?: number;
    inclusions: Inclusions;
    occupancyType: OccupancyType;
    message?: string;
}
