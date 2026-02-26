/**
 * Centralized Types Index
 * Re-exports all types for easier imports and better tree-shaking
 *
 * Usage:
 * import type { SessionUser, Property, Application } from "@/types";
 */

// ============================================================================
// Auth Types
// ============================================================================
export type {
    SessionUser,
    OtpCredentials,
} from "./auth.types";

// ============================================================================
// User Types
// ============================================================================
export type {
    UserProfile,
    UpdateProfile,
    UserLocation,
    NotificationPreferences,
    LikedProfile,
    ProfileSection,
    ProfileCompletion,
    ShareableProfile,
} from "./user.types";

// ============================================================================
// Property Types
// ============================================================================
export type {
    Property,
    GetPropertiesParams,
    GetPropertiesResponse,
    Inclusions,
    InclusionType,
    Inclusion,
} from "./property.types";

// ============================================================================
// Application Types
// ============================================================================
export type {
    CreateApplicationRequest,
    ApplicationFormData,
    ApplicationSnapshot,
} from "./application.types";

// ============================================================================
// Database Types
// ============================================================================
export type {
    AppRole,
    ApplicationStatus,
    ApplicationType,
    OccupancyType,
    ListingType,
    Gender,
    PreferredContactMethod,
    EmploymentStatus,
    StudentStatus,
    DocumentType,
    Document,
    Documents,
    Address,
    Location,
    Database,
    Profile,
    ProfileInsert,
    ProfileUpdate,
    Property as DbProperty,
    PropertyInsert,
    PropertyUpdate,
    Unit,
    UnitInsert,
    UnitUpdate,
    UnitAvailability,
    UnitAvailabilityInsert,
    UnitAvailabilityUpdate,
    UnitShare,
    UnitShareInsert,
    UnitShareUpdate,
    Application,
    ApplicationInsert,
    ApplicationUpdate,
    ApplicationSnapshot as DbApplicationSnapshot,
    ApplicationSnapshotInsert,
    ApplicationSnapshotUpdate,
    UserRole,
    UserRoleInsert,
    UserRoleUpdate,
    UserApplicationProfile,
    UserApplicationProfileInsert,
    UserApplicationProfileUpdate,
} from "./db";

