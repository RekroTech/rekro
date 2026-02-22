import { AppRole } from "@/types/db";

/**
 * Supabase Auth User (from auth.users table)
 * This is the raw user object returned by Supabase auth methods
 * like signInWithPassword() and signUp()
 */
export interface AuthUser {
    id: string;
    aud: string;
    role?: string;
    email?: string;
    email_confirmed_at?: string;
    phone?: string;
    phone_confirmed_at?: string;
    confirmed_at?: string;
    last_sign_in_at?: string;
    app_metadata: {
        provider?: string;
        providers?: string[];
        [key: string]: unknown;
    };
    user_metadata: {
        name?: string;
        avatar_url?: string;
        [key: string]: unknown;
    };
    identities?: Array<{
        id: string;
        user_id: string;
        identity_data?: Record<string, unknown>;
        provider: string;
        last_sign_in_at?: string;
        created_at?: string;
        updated_at?: string;
    }>;
    created_at: string;
    updated_at?: string;
}

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

/**
 * User identity used for authentication/authorization in the app.
 * Comes from auth.users + public.users + public.user_roles.
 * Note: each user has a single role.
 */
export interface SessionUser {
    id: string;
    email: string;
    name?: string | null;
    image_url?: string | null;
    username?: string | null;
    phone?: string | null;
    role: AppRole;
}

/**
 * Success payload returned by /api/auth/login and /api/auth/signup
 */
export interface AuthSuccess {
    user: SessionUser | null;
    requiresEmailConfirmation?: boolean;
    message?: string;
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
