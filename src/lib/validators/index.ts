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
    PropertyFormData,
} from "./property";

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

