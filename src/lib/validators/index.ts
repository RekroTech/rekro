/**
 * Central export point for all validators
 */

// Property validators
export {
    PropertySchema,
    UnitSchema,
    PropertyWithUnitsSchema,
    GetPropertiesParamsSchema,
    GetPropertiesResponseSchema,
    PropertyFormSchema,
} from "./property";

export type {
    Property,
    Unit,
    PropertyWithUnits,
    GetPropertiesParams,
    GetPropertiesResponse,
} from "./property";

// Property Form validators
export {
    ListingTypeSelectionSchema,
    UnitStatusSchema,
    PropertyFormDataSchema,
    UnitFormDataSchema,
    PropertyAPIRequestSchema,
    PropertyDataSchema,
    UnitDataSchema,
} from "./propertyForm";

export type {
    ListingTypeSelection,
    UnitStatus,
    PropertyFormData,
    UnitFormData,
    PropertyAPIRequest,
    PropertyData,
    UnitData,
} from "./propertyForm";

// Application validators
export {
    OccupancyTypeSchema,
    ApplicationTypeSchema,
    ApplicationStatusSchema,
    InclusionSchema,
    InclusionsSchema,
    ApplicationFormDataSchema,
    ProfileSnapshotSchema,
    FinanceSnapshotSchema,
    RentalSnapshotSchema,
    ApplicationSnapshotSchema,
    CreateApplicationRequestSchema,
    ApplicationSchema,
} from "./application";

export type {
    OccupancyType,
    ApplicationType,
    ApplicationStatus,
    Inclusion,
    Inclusions,
    ApplicationFormData,
    ProfileSnapshot,
    FinanceSnapshot,
    RentalSnapshot,
    ApplicationSnapshot,
    CreateApplicationRequest,
    Application,
} from "./application";

// User validators
export {
    UserProfileSchema,
    UserApplicationProfileSchema,
    ProfileUpdateSchema,
    ApplicationProfileUpdateSchema,
    CompleteProfileSchema,
    PhoneSendOtpSchema,
    PhoneVerifyOtpSchema,
} from "./user";

export type {
    UserProfile,
    UserApplicationProfile,
    ProfileUpdate,
    ApplicationProfileUpdate,
    CompleteProfile,
    PhoneSendOtp,
    PhoneVerifyOtp,
} from "./user";

// Enquiry validators
export {
    EnquiryRequestSchema,
    EnquirySchema,
    EnquiryInsertSchema,
} from "./enquiry";

export type {
    EnquiryRequest,
    Enquiry,
    EnquiryInsert,
} from "./enquiry";

// Email validators (re-exported from email module for convenience)
export {
    enquiryNotificationSchema,
    enquiryConfirmationSchema,
} from "../email/schemas";

export type {
    EnquiryNotification,
    EnquiryConfirmation,
} from "../email/schemas";

