// Credentials
export interface SignupCredentials {
    email: string;
    password: string;
    name?: string;
    role?: "tenant" | "landlord"; // Optional role selection during signup
}

export interface LoginCredentials {
    email: string;
    password: string;
}

// User roles matching database enum
export type AppRole = "tenant" | "landlord" | "admin" | "super_admin";

// User model used throughout the app (clean, internal)
export interface User {
    id: string;
    email: string;
    name?: string | null;
    phone?: string | null;
    roles?: AppRole[];
    full_name?: string | null;
    image_url?: string | null;
    current_location?: Record<string, unknown> | null;
    max_budget_per_week?: number | null;
    receive_marketing_email?: boolean;
    created_at?: string;
    updated_at?: string;
}

/**
 * Success payload returned by /api/auth/login and /api/auth/signup
 */
export interface AuthSuccess {
    user: User;
}

/**
 * Success payload returned by /api/auth/logout
 */
export interface LogoutSuccess {
    success: true;
}

/**
 * Standard error payload returned by your API routes
 * (matches: NextResponse.json({ error: "..." }))
 */
export interface ApiError {
    error: string;
}

/**
 * Optional: richer internal error model (not what the API returns)
 * Use this only if you want codes, localization, etc.
 */
export interface AuthError {
    message: string;
    code?: string;
}

/**
 * Type for updating user profile
 */
export type UserUpdate = Omit<Partial<User>, "id" | "email"> & {
    name?: string | null;
    avatar_url?: string | null;
};
