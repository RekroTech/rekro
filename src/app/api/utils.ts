/**
 * API Route Utilities
 * Common utilities for API routes
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuthForApi, requireRole } from "@/lib/supabase/server";
import type { SessionUser } from "@/types/auth.types";
import type { AppRole } from "@/types/db";
import { UserProfile } from "@/types/user.types";
import { ApplicationType, OccupancyType } from "@/types/db";
import { Inclusions } from "@/types/property.types";
import { ApplicationSnapshot } from "@/types/application.types";
import { getCurrentTimestamp } from "@/lib/utils";

// ─── CSRF ────────────────────────────────────────────────────────────────────

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

type CsrfMode = "auto" | "required" | "skip";

type PrecheckOptions = {
    auth?: boolean;
    roles?: AppRole[];
    csrf?: CsrfMode;
};

function safeOrigin(url: string | null): string | null {
    if (!url) return null;
    try {
        return new URL(url).origin;
    } catch {
        return null;
    }
}

function getAllowedOrigins(): Set<string> {
    const raw = [process.env.NEXT_PUBLIC_APP_URL, "http://localhost:3000", "http://localhost:3001"].filter(Boolean) as string[];
    const normalized = raw
        .map((value) => safeOrigin(value))
        .filter((value): value is string => !!value);
    return new Set(normalized);
}

function validateCsrfOrigin(request: NextRequest): { allowed: boolean; reason?: string } {
    const originHeader = request.headers.get("origin");
    const refererHeader = request.headers.get("referer");
    const allowed = getAllowedOrigins();

    // Mutating browser requests should send Origin/Referer; treat missing as suspicious.
    if (!originHeader && !refererHeader) {
        return { allowed: false, reason: "Missing origin and referer" };
    }

    const candidate = safeOrigin(originHeader) ?? safeOrigin(refererHeader);
    if (!candidate) {
        return { allowed: false, reason: "Invalid origin/referer" };
    }

    if (allowed.has(candidate)) return { allowed: true };

    return { allowed: false, reason: `Unexpected origin: ${candidate}` };
}

// ─── precheck ────────────────────────────────────────────────────────────────

/**
 * Unified pre-flight check for API route handlers.
 *
 * - CSRF defaults to `auto` (enforced for mutating methods).
 * - Pass `{ auth: true }` to require a valid session.
 * - Pass `{ auth: true, roles: ["admin"] }` to require a specific role.
 *
 * @example – public mutation (CSRF only)
 *   const check = await precheck(request);
 *   if (!check.ok) return check.error;
 *
 * @example – authenticated mutation
 *   const check = await precheck(request, { auth: true });
 *   if (!check.ok) return check.error;
 *   const { user } = check; // SessionUser
 *
 * @example – role-restricted mutation
 *   const check = await precheck(request, { auth: true, roles: ["admin"] });
 *   if (!check.ok) return check.error;
 *   const { user } = check; // SessionUser with verified role
 */
export async function precheck(
    request: NextRequest,
    opts?: PrecheckOptions & { auth?: false },
): Promise<{ ok: true } | { ok: false; error: NextResponse }>;

export async function precheck(
    request: NextRequest,
    opts: PrecheckOptions & { auth: true },
): Promise<{ ok: true; user: SessionUser } | { ok: false; error: NextResponse }>;

export async function precheck(
    request: NextRequest,
    opts?: PrecheckOptions,
): Promise<{ ok: true; user?: SessionUser } | { ok: false; error: NextResponse }> {
    const csrf = opts?.csrf ?? "auto";
    const shouldRunCsrf = csrf === "required" || (csrf === "auto" && !SAFE_METHODS.has(request.method));

    // 1. CSRF
    if (shouldRunCsrf) {
        const csrf = validateCsrfOrigin(request);
        if (!csrf.allowed) {
            console.warn(`[CSRF] Blocked ${request.method} ${request.nextUrl.pathname} — ${csrf.reason}`);
            return { ok: false, error: errorResponse("Forbidden", 403) };
        }
    }

    // 2. Auth (optional)
    const shouldAuth = opts?.auth ?? Boolean(opts?.roles?.length);
    if (shouldAuth) {
        try {
            const user = opts?.roles?.length
                ? await requireRole(...opts.roles)
                : await requireAuthForApi();
            return { ok: true, user };
        } catch (err) {
            if (err instanceof Error) {
                if (err.message === "Unauthorized") return { ok: false, error: errorResponse("Unauthorized", 401) };
                if (err.message === "Forbidden")    return { ok: false, error: errorResponse("Forbidden", 403) };
            }
            console.error("[precheck] Unexpected auth error:", err);
            return { ok: false, error: errorResponse("Internal server error", 500) };
        }
    }

    return { ok: true };
}

// ─── Responses ───────────────────────────────────────────────────────────────

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
        { status, headers: { "Cache-Control": "no-store" } }
    );
}

/**
 * Standard success response
 */
export function successResponse<T>(
    data: T,
    status: number = 200,
    options?: { cacheControl?: string; additionalHeaders?: Record<string, string> }
) {
    const headers: Record<string, string> = {
        "Cache-Control": options?.cacheControl || "no-store",
        ...options?.additionalHeaders,
    };
    return NextResponse.json(data, { status, headers });
}

/** Auth-specific error response (always no-store) */
export function authErrorResponse(message: string, status: number = 401) {
    return errorResponse(message, status);
}

/** Auth-specific success response (always no-store) */
export function authSuccessResponse<T>(data: T, status: number = 200) {
    return successResponse(data, status);
}

// ─── Validation ──────────────────────────────────────────────────────────────

export function validateRequiredFields<T extends Record<string, unknown>>(
    body: T,
    requiredFields: (keyof T)[]
): { valid: true } | { valid: false; missing: string[] } {
    const missing = requiredFields.filter(
        (f) => !body[f] || (typeof body[f] === "string" && !(body[f] as string).trim())
    );
    return missing.length > 0
        ? { valid: false, missing: missing.map(String) }
        : { valid: true };
}

// ─── Rate Limiting (in-memory) ───────────────────────────────────────────────

const requestCounts = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
    identifier: string,
    maxRequests = 10,
    windowMs = 60_000
): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const record = requestCounts.get(identifier);

    if (!record || now > record.resetAt) {
        const resetAt = now + windowMs;
        requestCounts.set(identifier, { count: 1, resetAt });
        return { allowed: true, remaining: maxRequests - 1, resetAt };
    }
    if (record.count >= maxRequests) {
        return { allowed: false, remaining: 0, resetAt: record.resetAt };
    }
    record.count++;
    return { allowed: true, remaining: maxRequests - record.count, resetAt: record.resetAt };
}

setInterval(() => {
    const now = Date.now();
    for (const [key, record] of requestCounts.entries()) {
        if (now > record.resetAt) requestCounts.delete(key);
    }
}, 60_000);

// ─── Application Snapshot ────────────────────────────────────────────────────

/**
 * Creates an application snapshot from user profile and application data.
 * Stored as JSONB in the database for historical record.
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
        lease: {
            moveInDate: applicationData.moveInDate,
            rentalDuration: applicationData.rentalDuration,
            applicationType: applicationData.applicationType,
            proposedRent: applicationData.proposedRent ?? 0,
            totalRent: applicationData.totalRent ?? 0,
            submittedAt: getCurrentTimestamp(),
            inclusions: applicationData.inclusions || {},
            occupancyType: applicationData.occupancyType,
        },
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
