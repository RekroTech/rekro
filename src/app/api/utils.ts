/**
 * API Route Utilities
 * Common utilities for API routes
 */

import { NextResponse } from "next/server";

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

    return NextResponse.json(
        { success: true, data },
        {
            status,
            headers,
        }
    );
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
