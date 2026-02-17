import type { ApplicationSnapshot } from "@/types/application.types";
import type { ApplicationType, OccupancyType } from "@/types/db";
import type { UserProfile } from "@/types/user.types";
import type { Inclusions } from "@/components/Property/types";

/**
 * Creates an application snapshot from user profile and application data
 * This snapshot will be stored as JSONB in the database for historical record
 */
export function createApplicationSnapshot(
    user: UserProfile,
    applicationData: {
        moveInDate: string;
        rentalDuration: string;
        applicationType: ApplicationType;
        propertyId: string;
        unitId: string | null;
        proposedRent?: number;
        totalRent?: number;
        inclusions?: Inclusions;
        occupancyType: OccupancyType;
        message?: string;
    }
): ApplicationSnapshot {
    return {
        // Application specific data
        lease: {
            moveInDate: applicationData.moveInDate,
            rentalDuration: applicationData.rentalDuration,
            applicationType: applicationData.applicationType,
            proposedRent: applicationData.proposedRent || 0,
            totalRent: applicationData.totalRent || 0,
            submittedAt: new Date().toISOString(),
            inclusions: applicationData.inclusions || {},
            occupancyType: applicationData.occupancyType,
        },

        // User profile snapshot at time of application
        profile: {
            fullName: user.full_name,
            email: user.email,
            phone: user.phone,
            dateOfBirth: user.date_of_birth,
            gender: user.gender,
            occupation: user.occupation,
            bio: user.bio,
            nativeLanguage: user.native_language,
            visaStatus: user.user_application_profile?.visa_status || null,
        },

        finance: {
            employmentStatus: user.user_application_profile?.employment_status || null,
            employmentType: user.user_application_profile?.employment_type || null,
            incomeSource: user.user_application_profile?.income_source || null,
            incomeFrequency: user.user_application_profile?.income_frequency || null,
            incomeAmount: user.user_application_profile?.income_amount || null,
            studentStatus: user.user_application_profile?.student_status || null,
            financeSupportType: user.user_application_profile?.finance_support_type || null,
            financeSupportDetails: user.user_application_profile?.finance_support_details || null,
        },

        rental: {
            preferredLocality: user.user_application_profile?.preferred_locality || null,
            maxBudgetPerWeek: user.user_application_profile?.max_budget_per_week || null,
            hasPets: user.user_application_profile?.has_pets || null,
            smoker: user.user_application_profile?.smoker || null,
            emergencyContactName: user.user_application_profile?.emergency_contact_name || null,
            emergencyContactPhone: user.user_application_profile?.emergency_contact_phone || null,
        },

        documents: user.user_application_profile?.documents || {},
    };
}
