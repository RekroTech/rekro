import { z } from "zod";

/**
 * Property Form validation schemas
 * Used for validating property form data in PropertyForm component
 */

// Listing type (UI selection that determines units)
export const ListingTypeSelectionSchema = z.enum(["entire_home", "room", "all"]);

// Unit status (UI field)
export const UnitStatusSchema = z.enum(["active", "leased", "inactive"]);

// Property form data schema
export const PropertyFormDataSchema = z.object({
    description: z.string().min(10, "Description must be at least 10 characters").max(5000, "Description is too long"),
    property_type: z.string().min(1, "Property type is required"),
    bedrooms: z.string().regex(/^\d+$/, "Must be a number").refine((val) => parseInt(val) >= 0 && parseInt(val) <= 20, "Bedrooms must be between 0 and 20"),
    bathrooms: z.string().regex(/^\d+$/, "Must be a number").refine((val) => parseInt(val) >= 0 && parseInt(val) <= 10, "Bathrooms must be between 0 and 10"),
    car_spaces: z.string().regex(/^\d+$/, "Must be a number").refine((val) => parseInt(val) >= 0 && parseInt(val) <= 10, "Car spaces must be between 0 and 10"),
    furnished: z.boolean(),
    bills_included: z.boolean(),
    amenities: z.array(z.string()),
    price: z.string(), // Base rent for the property
    address_full: z.string().min(1, "Full address is required"), // Complete formatted address for display
    address_street: z.string().min(1, "Street address is required"),
    address_city: z.string().min(1, "City is required"),
    address_state: z.string().min(2, "State is required").max(3),
    address_postcode: z.string().min(4, "Postcode is required").max(4),
    address_country: z.string().default("Australia"),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
});

// Unit form data schema
export const UnitFormDataSchema = z.object({
    id: z.string().uuid().optional(), // Existing unit ID, undefined for new units
    listing_type: z.enum(["entire_home", "room"]),
    name: z.string().max(100),
    unit_description: z.string().max(1000),
    price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Price must be a valid number"),
    bond_amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Bond must be a valid number"),
    min_lease: z.string().regex(/^\d+$/, "Must be a number"),
    max_lease: z.string().regex(/^\d+$/, "Must be a number"),
    max_occupants: z.string().regex(/^\d+$/, "Must be a number"),
    size_sqm: z.string().regex(/^\d+(\.\d{1,2})?$/, "Size must be a valid number").optional(),
    available_from: z.string(), // Date string
    available_to: z.string(), // Date string
    status: UnitStatusSchema,
    availability_notes: z.string().max(500),
});

// Property API request schema (for property routes)
export const PropertyAPIRequestSchema = z.object({
    propertyData: z.string().transform((str) => {
        try {
            return JSON.parse(str);
        } catch {
            throw new Error("Invalid propertyData JSON");
        }
    }),
    unitsData: z.string().optional().transform((str) => {
        if (!str) return [];
        try {
            return JSON.parse(str);
        } catch {
            throw new Error("Invalid unitsData JSON");
        }
    }),
    existingImages: z.string().optional().transform((str) => {
        if (!str) return [];
        try {
            return JSON.parse(str);
        } catch {
            throw new Error("Invalid existingImages JSON");
        }
    }),
    deletedUnitIds: z.string().optional().transform((str) => {
        if (!str) return [];
        try {
            return JSON.parse(str);
        } catch {
            throw new Error("Invalid deletedUnitIds JSON");
        }
    }),
});

// Property insert/update data schema (database layer)
// Matches the DB PropertyInsert shape and what PropertyForm.tsx sends
export const PropertyDataSchema = z.object({
    description: z.string().nullable().optional(),
    property_type: z.string().nullable().optional(),
    bedrooms: z.number().int().min(0).max(20).nullable().optional(),
    bathrooms: z.number().int().min(0).max(10).nullable().optional(),
    car_spaces: z.number().int().min(0).max(10).nullable().optional(),
    furnished: z.boolean().default(false),
    bills_included: z.boolean().default(false),
    amenities: z.array(z.string()).nullable().optional(),
    price: z.number().min(0).default(0),
    address: z.object({
        street: z.string(),
        city: z.string().optional(),
        suburb: z.string().optional(),
        state: z.string(),
        postcode: z.string(),
        country: z.string().optional(),
    }),
    location: z
        .object({
            city: z.string(),
            state: z.string(),
            country: z.string(),
        })
        .nullable()
        .optional(),
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
    images: z.array(z.string()).nullable().optional(),
    video_url: z.string().url().nullable().optional(),
    // Allow API callers to explicitly control publish state when needed.
    is_published: z.boolean().optional(),
});

// Unit insert/update data schema (database layer)
export const UnitDataSchema = z.object({
    id: z.string().uuid().optional(),
    property_id: z.string().uuid().optional(),
    listing_type: z.enum(["entire_home", "room"]),
    name: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    price: z.number().positive(),
    bond_amount: z.number().min(0),
    min_lease: z.number().int().positive().nullable().optional(),
    max_lease: z.number().int().positive().nullable().optional(),
    max_occupants: z.number().int().positive().nullable().optional(),
    size_sqm: z.number().positive().nullable().optional(),
    available_from: z.string().nullable().optional(),
    available_to: z.string().nullable().optional(),
    status: z.enum(["active", "leased", "inactive"]).default("inactive"),
    features: z.array(z.string()).nullable().optional(),
});

// Type exports
export type ListingTypeSelection = z.infer<typeof ListingTypeSelectionSchema>;
export type UnitStatus = z.infer<typeof UnitStatusSchema>;
export type PropertyFormData = z.infer<typeof PropertyFormDataSchema>;
export type UnitFormData = z.infer<typeof UnitFormDataSchema>;
export type PropertyAPIRequest = z.infer<typeof PropertyAPIRequestSchema>;
export type PropertyData = z.infer<typeof PropertyDataSchema>;
export type UnitData = z.infer<typeof UnitDataSchema>;

