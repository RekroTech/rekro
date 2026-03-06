import { z } from "zod";

/**
 * User and profile validation schemas
 * Used for runtime validation of API inputs/outputs
 */

// Base user profile schema
export const UserProfileSchema = z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    full_name: z.string().nullable(),
    username: z.string().nullable(),
    phone: z.string().nullable(),
    image_url: z.string().url().nullable().optional(),
    current_location: z.record(z.string(), z.unknown()).nullable().optional(),
    native_language: z.string().nullable().optional(),
    receive_marketing_email: z.boolean().default(false),
    date_of_birth: z.string().nullable().optional(),
    gender: z.enum(["male", "female", "non_binary", "prefer_not_to_say"]).nullable().optional(),
    occupation: z.string().nullable().optional(),
    bio: z.string().max(500).nullable().optional(),
    preferred_contact_method: z.enum(["email", "phone", "sms"]).nullable().optional(),
    notification_preferences: z.record(z.string(), z.unknown()).nullable().optional(),
    discoverable: z.boolean().default(true),
    share_contact: z.boolean().default(false),
});

// User application profile schema
export const UserApplicationProfileSchema = z.object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    visa_status: z.string().nullable().optional(),
    employment_status: z.enum(["working", "not_working"]).nullable().optional(),
    employment_type: z.string().nullable().optional(),
    income_source: z.string().nullable().optional(),
    income_frequency: z.string().nullable().optional(),
    income_amount: z.number().positive().nullable().optional(),
    student_status: z.enum(["student", "not_student"]).nullable().optional(),
    finance_support_type: z.string().nullable().optional(),
    finance_support_details: z.string().nullable().optional(),
    preferred_locality: z.string().nullable().optional(),
    max_budget_per_week: z.number().positive().nullable().optional(),
    has_pets: z.boolean().nullable().optional(),
    smoker: z.boolean().nullable().optional(),
    emergency_contact_name: z.string().nullable().optional(),
    emergency_contact_phone: z.string().nullable().optional(),
    documents: z.record(z.string(), z.unknown()).nullable().optional(),
});

// Profile update schema (partial)
export const ProfileUpdateSchema = UserProfileSchema.partial().omit({
    id: true,
    email: true, // Email can't be updated through profile API
});

// Application profile update schema (partial)
export const ApplicationProfileUpdateSchema = UserApplicationProfileSchema.partial().omit({
    id: true,
    user_id: true,
});

// Combined profile with application data
export const CompleteProfileSchema = UserProfileSchema.extend({
    user_application_profile: UserApplicationProfileSchema.nullable().optional(),
});

// Type exports
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type UserApplicationProfile = z.infer<typeof UserApplicationProfileSchema>;
export type ProfileUpdate = z.infer<typeof ProfileUpdateSchema>;
export type ApplicationProfileUpdate = z.infer<typeof ApplicationProfileUpdateSchema>;
export type CompleteProfile = z.infer<typeof CompleteProfileSchema>;

// Phone verification schemas
export const PhoneSendOtpSchema = z.object({
    phone: z.string().min(7, "Phone number is too short").max(20, "Phone number is too long"),
});

export const PhoneVerifyOtpSchema = z.object({
    phone: z.string().min(7, "Phone number is too short").max(20, "Phone number is too long"),
    token: z.string().length(6, "OTP must be exactly 6 digits").regex(/^\d{6}$/, "OTP must contain only digits"),
});

export type PhoneSendOtp = z.infer<typeof PhoneSendOtpSchema>;
export type PhoneVerifyOtp = z.infer<typeof PhoneVerifyOtpSchema>;

