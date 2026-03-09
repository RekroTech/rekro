/**
 * Phone number utilities for AU phone validation and normalisation.
 */

import { parsePhoneNumber, isValidPhoneNumber } from "libphonenumber-js";

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
        return parsed?.isValid() === true && parsed.country === "AU";
    } catch {
        return false;
    }
}

