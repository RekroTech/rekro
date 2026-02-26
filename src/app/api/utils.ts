/**
 * API Route Utilities
 * Common utilities for API routes
 */

import { NextResponse } from "next/server";
import { UserProfile } from "@/types/user.types";
import { ApplicationType, OccupancyType } from "@/types/db";
import { Inclusions } from "@/types/property.types";
import { ApplicationSnapshot } from "@/types/application.types";
import { getCurrentTimestamp } from "@/lib/utils";

/**
 * Standard error response
 */
export function errorResponse(
    message: string,
    status: number = 500,
    additionalData?: Record<string, unknown>
) {
    return NextResponse.json(
        { error: message, ...additionalData },
        {
            status,
            headers: {
                "Cache-Control": "no-store",
            },
        }
    );
}

/**
 * Standard success response
 */
export function successResponse<T>(
    data: T,
    status: number = 200,
    options?: {
        cacheControl?: string;
        additionalHeaders?: Record<string, string>;
    }
) {
    const headers: Record<string, string> = {
        "Cache-Control": options?.cacheControl || "no-store",
        ...options?.additionalHeaders,
    };

    return NextResponse.json(data, {
        status,
        headers,
    });
}

/**
 * Auth-specific error response (always no-store)
 */
export function authErrorResponse(message: string, status: number = 401) {
    return errorResponse(message, status);
}

/**
 * Auth-specific success response (always no-store)
 */
export function authSuccessResponse<T>(data: T, status: number = 200) {
    return successResponse(data, status);
}

/**
 * Validate request body fields
 */
export function validateRequiredFields<T extends Record<string, unknown>>(
    body: T,
    requiredFields: (keyof T)[]
): { valid: true } | { valid: false; missing: string[] } {
    const missing: string[] = [];

    for (const field of requiredFields) {
        if (!body[field] || (typeof body[field] === "string" && !body[field])) {
            missing.push(String(field));
        }
    }

    if (missing.length > 0) {
        return { valid: false, missing };
    }

    return { valid: true };
}

/**
 * Rate limiting helper (basic in-memory implementation)
 * For production, use a proper rate limiting service like Upstash or Redis
 */
const requestCounts = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
    identifier: string,
    maxRequests: number = 10,
    windowMs: number = 60000
): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const record = requestCounts.get(identifier);

    if (!record || now > record.resetAt) {
        // New window
        const resetAt = now + windowMs;
        requestCounts.set(identifier, { count: 1, resetAt });
        return { allowed: true, remaining: maxRequests - 1, resetAt };
    }

    if (record.count >= maxRequests) {
        return { allowed: false, remaining: 0, resetAt: record.resetAt };
    }

    record.count++;
    requestCounts.set(identifier, record);
    return { allowed: true, remaining: maxRequests - record.count, resetAt: record.resetAt };
}

/**
 * Clean up old rate limit records periodically
 */
setInterval(() => {
    const now = Date.now();
    for (const [key, record] of requestCounts.entries()) {
        if (now > record.resetAt) {
            requestCounts.delete(key);
        }
    }
}, 60000); // Clean up every minute

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
            submittedAt: getCurrentTimestamp(),
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
