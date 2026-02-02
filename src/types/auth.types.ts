// Credentials
export interface SignupCredentials {
    email: string;
    password: string;
    name?: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

// User model used throughout the app (clean, internal)
export interface User {
    id: string;
    email: string;
    name?: string | null;
    avatar_url?: string | null;
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
