/**
 * Email validation utility
 * @param email - Email address to validate
 * @returns true if valid email format
 */
export function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Normalize email to lowercase and trim whitespace
 * @param email - Email address to normalize
 * @returns normalized email
 */
export function normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
}

/**
 * Validate and normalize email
 * @param email - Email address to process
 * @returns object with normalized email and validation result
 */
export function processEmail(email: string): {
    normalized: string;
    isValid: boolean;
    error?: string;
} {
    const normalized = normalizeEmail(email);

    if (!normalized) {
        return { normalized, isValid: false, error: "Email is required" };
    }

    if (!isValidEmail(normalized)) {
        return { normalized, isValid: false, error: "Please enter a valid email address" };
    }

    return { normalized, isValid: true };
}

