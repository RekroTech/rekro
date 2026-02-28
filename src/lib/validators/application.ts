import { z } from "zod";

/**
 * Application validation schemas
 * Used for runtime validation of API inputs/outputs
 */

// Occupancy type
export const OccupancyTypeSchema = z.enum(["individual", "couple", "family", "group"]);

// Application type
export const ApplicationTypeSchema = z.enum(["entire_property", "unit"]);

// Application status
export const ApplicationStatusSchema = z.enum([
    "draft",
    "submitted",
    "under_review",
    "approved",
    "rejected",
    "withdrawn",
]);

// Inclusion schema
export const InclusionSchema = z.object({
    selected: z.boolean(),
    price: z.number().min(0),
});

// Inclusions schema
export const InclusionsSchema = z.record(
    z.enum(["furniture", "bills", "cleaning", "carpark", "storage"]),
    InclusionSchema
).optional();

// Application form data schema
export const ApplicationFormDataSchema = z.object({
    moveInDate: z.string().min(1, "Move-in date is required"),
    rentalDuration: z.string().min(1, "Rental duration is required"),
    proposedRent: z.string().optional(),
    totalRent: z.number().positive().optional(),
    inclusions: InclusionsSchema,
    occupancyType: OccupancyTypeSchema,
    message: z.string().max(1000).optional(),
});

// Profile snapshot schema
export const ProfileSnapshotSchema = z.object({
    fullName: z.string().nullable(),
    email: z.string().email().nullable(),
    phone: z.string().nullable(),
    dateOfBirth: z.string().nullable(),
    gender: z.string().nullable(),
    occupation: z.string().nullable(),
    bio: z.string().nullable(),
    nativeLanguage: z.string().nullable(),
    visaStatus: z.string().nullable(),
});

// Finance snapshot schema
export const FinanceSnapshotSchema = z.object({
    employmentStatus: z.string().nullable(),
    employmentType: z.string().nullable(),
    incomeSource: z.string().nullable(),
    incomeFrequency: z.string().nullable(),
    incomeAmount: z.number().nullable(),
    studentStatus: z.string().nullable(),
    financeSupportType: z.string().nullable(),
    financeSupportDetails: z.string().nullable(),
});

// Rental snapshot schema
export const RentalSnapshotSchema = z.object({
    preferredLocality: z.string().nullable(),
    maxBudgetPerWeek: z.number().nullable(),
    hasPets: z.boolean().nullable(),
    smoker: z.boolean().nullable(),
    emergencyContactName: z.string().nullable(),
    emergencyContactPhone: z.string().nullable(),
});

// Application snapshot schema
export const ApplicationSnapshotSchema = z.object({
    lease: z.object({
        moveInDate: z.string(),
        rentalDuration: z.string(),
        proposedRent: z.number(),
        totalRent: z.number(),
        applicationType: ApplicationTypeSchema,
        submittedAt: z.string(),
        inclusions: InclusionsSchema,
        occupancyType: OccupancyTypeSchema,
    }),
    profile: ProfileSnapshotSchema,
    finance: FinanceSnapshotSchema,
    rental: RentalSnapshotSchema,
    documents: z.record(z.string(), z.unknown()),
});

// Create application request schema
export const CreateApplicationRequestSchema = z.object({
    applicationId: z.string().uuid().optional(),
    propertyId: z.string().uuid(),
    unitId: z.string().uuid().nullable().optional(),
    applicationType: ApplicationTypeSchema,
    moveInDate: z.string().min(1),
    rentalDuration: z.string().min(1),
    proposedRent: z.string().optional(),
    totalRent: z.number().positive().optional(),
    inclusions: InclusionsSchema,
    occupancyType: OccupancyTypeSchema,
    message: z.string().max(1000).optional(),
    status: ApplicationStatusSchema.optional(),
});

// Application schema (full database record)
export const ApplicationSchema = z.object({
    id: z.string().uuid(),
    propertyId: z.string().uuid(),
    unitId: z.string().uuid().nullable(),
    applicantId: z.string().uuid(),
    landlordId: z.string().uuid(),
    applicationType: ApplicationTypeSchema,
    status: ApplicationStatusSchema,
    snapshotData: ApplicationSnapshotSchema,
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    submittedAt: z.string().datetime().nullable(),
});

// Type exports
export type OccupancyType = z.infer<typeof OccupancyTypeSchema>;
export type ApplicationType = z.infer<typeof ApplicationTypeSchema>;
export type ApplicationStatus = z.infer<typeof ApplicationStatusSchema>;
export type Inclusion = z.infer<typeof InclusionSchema>;
export type Inclusions = z.infer<typeof InclusionsSchema>;
export type ApplicationFormData = z.infer<typeof ApplicationFormDataSchema>;
export type ProfileSnapshot = z.infer<typeof ProfileSnapshotSchema>;
export type FinanceSnapshot = z.infer<typeof FinanceSnapshotSchema>;
export type RentalSnapshot = z.infer<typeof RentalSnapshotSchema>;
export type ApplicationSnapshot = z.infer<typeof ApplicationSnapshotSchema>;
export type CreateApplicationRequest = z.infer<typeof CreateApplicationRequestSchema>;
export type Application = z.infer<typeof ApplicationSchema>;

