/**
 * Validation Utilities
 * Reusable validation functions
 */

/**
 * Type guard to check if a value is a non-empty string
 */
export function isNonEmptyString(v: unknown): v is string {
    return typeof v === "string" && v.trim().length > 0;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function isValidPassword(password: string, minLength: number = 6): boolean {
    return password.length >= minLength;
}

