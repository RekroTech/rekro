/**
 * API Error Handler Utilities
 * Centralized error type guards and handlers
 */

export interface ApiError {
    error: string;
}

/**
 * Type guard to check if a response is an API error
 */
export function isApiError(x: unknown): x is ApiError {
    return (
        typeof x === "object" &&
        x !== null &&
        "error" in x &&
        typeof (x as { error?: unknown }).error === "string"
    );
}

/**
 * Extract error message from API response or fallback
 */
export async function extractErrorMessage(
    response: Response,
    fallback: string
): Promise<string> {
    const body: unknown = await response.json().catch(() => null);
    return isApiError(body) ? body.error : fallback;
}

/**
 * Handle fetch errors consistently
 */
export async function handleFetchError(
    response: Response,
    fallback: string
): Promise<never> {
    const message = await extractErrorMessage(response, fallback);
    throw new Error(message);
}

