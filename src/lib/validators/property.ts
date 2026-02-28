import { z } from "zod";

/**
 * Property validation schemas
 * Used for runtime validation of API inputs/outputs
 */

// Base property schema
export const PropertySchema = z.object({
    id: z.string().uuid(),
    title: z.string().min(1, "Title is required").max(200),
    description: z.string().min(10, "Description must be at least 10 characters").optional().nullable(),
    street: z.string().min(1, "Street is required"),
    suburb: z.string().min(1, "Suburb is required"),
    state: z.string().min(2).max(3),
    postcode: z.string().min(4).max(4),
    country: z.string().default("Australia"),
    latitude: z.number().min(-90).max(90).optional().nullable(),
    longitude: z.number().min(-180).max(180).optional().nullable(),
    propertyType: z.enum(["house", "apartment", "townhouse", "studio"]),
    bedrooms: z.number().int().min(0).max(20),
    bathrooms: z.number().int().min(0).max(10),
    carSpaces: z.number().int().min(0).max(10).optional().nullable(),
    landSize: z.number().positive().optional().nullable(),
    buildingSize: z.number().positive().optional().nullable(),
    yearBuilt: z.number().int().min(1800).max(new Date().getFullYear() + 2).optional().nullable(),
    listingType: z.enum(["entire_home", "private_room", "shared_room"]),
    status: z.enum(["active", "leased", "inactive"]).default("active"),
    isPublished: z.boolean().default(false),
    landlordId: z.string().uuid(),
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional(),
});

// Unit schema
export const UnitSchema = z.object({
    id: z.string().uuid(),
    propertyId: z.string().uuid(),
    unitNumber: z.string().optional().nullable(),
    bedrooms: z.number().int().min(0).max(20),
    bathrooms: z.number().int().min(0).max(10),
    rentPerWeek: z.number().positive(),
    bond: z.number().min(0),
    availableFrom: z.string().optional().nullable(),
    leaseDuration: z.string().optional().nullable(),
    furnished: z.boolean().default(false),
    features: z.array(z.string()).default([]),
    status: z.enum(["available", "pending", "leased"]).default("available"),
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional(),
});

// Property with units schema
export const PropertyWithUnitsSchema = PropertySchema.extend({
    units: z.array(UnitSchema),
});

// Get properties params schema
export const GetPropertiesParamsSchema = z.object({
    limit: z.number().int().positive().max(100).default(12),
    offset: z.number().int().min(0).default(0),
    isPublished: z.boolean().optional(),
    userId: z.string().uuid().optional(),
    likedOnly: z.boolean().optional(),
    search: z.string().min(1).optional(),
    propertyType: z.string().optional(),
    minBedrooms: z.number().int().min(0).optional(),
    minBathrooms: z.number().int().min(0).optional(),
    furnished: z.boolean().optional(),
    listingType: z.string().optional(),
    status: z.enum(["active", "leased", "inactive"]).optional(),
});

// Get properties response schema
export const GetPropertiesResponseSchema = z.object({
    data: z.array(PropertyWithUnitsSchema),
    nextOffset: z.number().nullable(),
    hasMore: z.boolean(),
});

// Property create/update schema (for form data)
export const PropertyFormSchema = PropertySchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    landlordId: true,
}).partial({
    status: true,
    isPublished: true,
});

// Type exports
export type Property = z.infer<typeof PropertySchema>;
export type Unit = z.infer<typeof UnitSchema>;
export type PropertyWithUnits = z.infer<typeof PropertyWithUnitsSchema>;
export type GetPropertiesParams = z.infer<typeof GetPropertiesParamsSchema>;
export type GetPropertiesResponse = z.infer<typeof GetPropertiesResponseSchema>;
export type PropertyFormData = z.infer<typeof PropertyFormSchema>;

