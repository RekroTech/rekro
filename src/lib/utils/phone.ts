/**
 * Phone number utilities for AU phone validation and normalisation.
 */

import { parsePhoneNumber, isValidPhoneNumber } from "libphonenumber-js";

/**
 * Normalise a user-supplied phone number to E.164 format using libphonenumber-js.
 * Falls back to manual normalisation for numbers the library cannot parse.
 * Defaults to AU (+61) when no country code is present.
 */
export function toE164(raw: string): string {
    try {
        const parsed = parsePhoneNumber(raw, "AU");
        if (parsed?.isValid()) return parsed.format("E.164");
    } catch {
        // fall through to manual normalisation
    }
    // Manual fallback: strip formatting chars then apply AU country code
    const cleaned = raw.replace(/[\s\-().]/g, "");
    if (cleaned.startsWith("+")) return cleaned;
    if (cleaned.startsWith("00")) return "+" + cleaned.slice(2);
    if (cleaned.startsWith("0")) return "+61" + cleaned.slice(1);
    return "+61" + cleaned;
}

/**
 * Converts a raw phone number to E.164 for storage AND produces the
 * digits-only variant used by Supabase auth.users.phone (no leading "+").
 *
 * Returns both so callers can store the E.164 form and compare against
 * the auth record without a separate strip at the call site.
 *
 * @example
 * toE164AndAuthDigits("0412 345 678")
 * // → { e164: "+61412345678", authDigits: "61412345678" }
 */
export function toE164AndAuthDigits(raw: string): { e164: string; authDigits: string } {
    const e164 = toE164(raw);
    return { e164, authDigits: e164.replace(/^\+/, "") };
}

/**
 * Canonical digits representation used for safe phone equality checks.
 * Returns null for empty/invalid-ish input instead of throwing.
 */
export function toCanonicalPhoneDigits(raw: string | null | undefined): string | null {
    if (!raw) return null;

    try {
        return toE164AndAuthDigits(raw).authDigits;
    } catch {
        const digits = raw.replace(/\D/g, "");
        return digits || null;
    }
}

/**
 * Normalise an AU phone string while typing:
 * - keeps digits, +, and spaces
 * - removes any + that isn't the first character
 */
export function normalisePhone(value: string): string {
    return value
        .replace(/[^\d+\s]/g, "")   // keep digits, +, spaces
        .replace(/(?!^\+)\+/g, ""); // remove any + that isn't the first char
}

/**
 * Validate an AU phone number using libphonenumber-js.
 * Accepts local (0412 345 678) and international (+61 412 345 678) formats.
 * Spaces are stripped before validation.
 */
export function validateAUPhone(raw: string): boolean {
    const phone = raw.replace(/\s/g, "");
    try {
        // Try explicit AU country context first (handles 0412… format)
        if (isValidPhoneNumber(phone, "AU")) return true;
        // Also accept explicit +61… international format
        const parsed = parsePhoneNumber(phone);
        return parsed?.isValid() && parsed.country === "AU";
    } catch {
        return false;
    }
}

/**
 * Phone conflict detection utilities for API error handling
 */

export const PHONE_CONFLICT_MESSAGE = "This phone number is already linked to another account.";

export function isPhoneConflictError(
    error: { message?: string | null; code?: string | null } | null | undefined
): boolean {
    const message = error?.message?.toLowerCase() ?? "";
    const code = error?.code?.toLowerCase() ?? "";

    return (
        code === "23505" || // PostgreSQL unique violation
        code === "phone_exists" ||
        message.includes("already been registered") ||
        message.includes("already registered") ||
        message.includes("already exists") ||
        message.includes("already linked") ||
        message.includes("duplicate") ||
        message.includes("unique")
    );
}